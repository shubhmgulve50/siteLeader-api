import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import HttpError from './httpError.js';
import axios from 'axios';

dotenv.config();
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`);
  },
});

const multerInstance = multer({
  storage: storage,
});

const upload = {
  fields: (fields) => multerInstance.fields(fields),
  single: (field) => multerInstance.single(field),
  array: (field, limit) => multerInstance.array(field, limit),
  none: () => multerInstance.none(),
};

export const generatePresignedURL = async (key, type) => {
  const params = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: type,
  });

  const expiresAt = 60; // 1 minute

  const presignedUrl = await getSignedUrl(s3, params, {
    expiresIn: expiresAt,
  });

  return presignedUrl;
};

const uploadFile = async (file, destination, createUniqueFilename = true) => {
  try {
    if (!file || (!file.path && !file.buffer)) {
      throw new HttpError('File not found or invalid file format', 400);
    }

    const fileMimeType = file.mimetype;
    const fileExtension = path.extname(file.originalname);

    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    let s3Key = destination;

    if (createUniqueFilename) {
      s3Key += `/${uniqueFilename}`;
    }

    const fileContent = file.path ? fs.readFileSync(file.path) : file.buffer;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: fileMimeType,
    };

    const command = new PutObjectCommand(params);

    await s3.send(command);

    return `${process.env.AWS_CLOUDFRONT_URL}/${s3Key}`;
  } catch (error) {
    throw new HttpError(error.message, 500);
  }
};

const deleteFile = async (url) => {
  try {
    const urlParts = new URL(url);
    const key = urlParts.pathname.substring(1); // Remove leading slash
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    const deleteCommand = new DeleteObjectCommand(params);

    await s3.send(deleteCommand);
    console.error(`File deleted: ${key}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3: ', error);
    return false;
  }
};

const deleteFiles = async (urls) => {
  try {
    if (!urls || urls.length === 0) {
      return true;
    }
    const keys = urls.map((url) => {
      const urlParts = new URL(url);
      return { Key: urlParts.pathname.substring(1) };
    });

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Delete: {
        Objects: keys,
        Quiet: false,
      },
    };

    const batchDeleteCommand = new DeleteObjectsCommand(params);

    await s3.send(batchDeleteCommand);
    console.error(`Files deleted: ${keys.map((k) => k.Key).join(', ')}`);
    return true;
  } catch (error) {
    console.error('Error deleting files from S3: ', error);
    return false;
  }
};

const deleteFolderFromS3 = async (folderPath) => {
  try {
    const folderPrefix = folderPath;

    // First, list all objects in the user's folder
    const listParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: folderPrefix,
    };

    const listCommand = new ListObjectsV2Command(listParams);
    const listedObjects = await s3.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log(`No files found in folder: ${folderPrefix}`);
      return true;
    }

    // Prepare the delete command with all objects
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Delete: {
        Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
        Quiet: false,
      },
    };

    const deleteCommand = new DeleteObjectsCommand(deleteParams);
    await s3.send(deleteCommand);

    console.log(`Deleted all files in folder: ${folderPrefix}`);
    return true;
  } catch (error) {
    console.error('Error deleting user folder from S3:', error);
    return false;
  }
};

const uploadBufferToS3 = async (buffer, presignedUrl, contentType = 'image/jpeg') => {
  try {
    const response = await axios.put(presignedUrl, buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length,
      },
    });

    console.log('Upload successful:', response.status);
  } catch (err) {
    console.error('Upload failed:', err.response?.status, err.message);
  }
};

export { upload, uploadFile, deleteFile, deleteFiles, deleteFolderFromS3, uploadBufferToS3 };
