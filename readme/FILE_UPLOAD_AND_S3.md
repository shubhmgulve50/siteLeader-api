# File Upload and S3 — siteLeader-api

## Overview

Files are uploaded to AWS S3 (`ap-south-1` region, bucket: `marriage-matrimony`) and served via CloudFront CDN (`https://d1ee7knodiza2n.cloudfront.net`).

Two upload paths exist:
1. **Server-side upload** — Multer receives file → `uploadFile()` pushes to S3.
2. **Presigned URL upload** — Client uploads directly to S3 via a 60-second presigned PUT URL.

---

## Files

| File | Purpose |
|---|---|
| `utils/file_upload.js` | All S3 operations: upload, delete, presigned URL generation |
| `constants/s3Upload.js` | `S3Client` instance + bucket name + CloudFront URL constants |

---

## `utils/file_upload.js` — API

### `uploadFile(file, destinationFolder)`
- Generates unique filename: `uuid()` + original extension.
- Calls `@aws-sdk/lib-storage` `Upload` for multipart upload.
- Returns CloudFront URL of uploaded file.

```javascript
const url = await uploadFile(req.file, 'users/123/documents');
// → "https://d1ee7knodiza2n.cloudfront.net/users/123/documents/<uuid>.pdf"
```

### `uploadBufferToS3(buffer, presignedUrl)`
- Uploads a raw `Buffer` to a presigned PUT URL via Axios PUT.
- Used when you have file content in memory (e.g. generated PDFs).

### `generatePresignedURL(key, contentType)`
- Generates a `PutObjectCommand` presigned URL valid for 60 seconds.
- Client uses this URL to PUT the file directly to S3.

```javascript
const url = await generatePresignedURL('users/123/profile.jpg', 'image/jpeg');
// Client: PUT url with file binary
```

### `deleteFile(cloudFrontUrl)`
- Extracts S3 key from CloudFront URL.
- Calls `DeleteObjectCommand`.

### `deleteFiles(cloudFrontUrls[])`
- Batch deletes up to 1000 objects via `DeleteObjectsCommand`.

### `deleteFolderFromS3(folderPrefix)`
- Lists all objects with prefix, then batch deletes.
- Used when deleting a user and cleaning up all their files.

---

## S3 folder structure

```
<bucket>/
└── users/
    └── {userId}/
        ├── documents/      ← PDFs, certificates
        ├── biodata/        ← Biodata PDFs
        └── profile-pictures/ ← Profile images
```

---

## Multer configuration

Multer is configured in `constants/s3Upload.js` or inline in routes that accept file uploads.
Storage: `memoryStorage` (files kept in Buffer, not written to disk).
File size limit: configured per route.

---

## CloudFront URL construction

```javascript
const CF_URL = process.env.AWS_CLOUDFRONT_URL; // "https://d1ee7knodiza2n.cloudfront.net"
const fileUrl = `${CF_URL}/${s3Key}`;
```

Always use CloudFront URLs when storing references in the database — never the raw S3 URL.

---

## Presigned URL flow (client-direct upload)

1. Client requests `POST /api/<resource>/presigned-url` with `{ fileName, contentType }`.
2. Controller calls `generatePresignedURL(key, contentType)`.
3. Returns `{ presignedUrl, fileUrl }` to client.
4. Client PUTs file binary to `presignedUrl` (expires in 60s).
5. Client saves `fileUrl` (CloudFront URL) in subsequent form submission.

---

*Last updated: 2026-04-17*
