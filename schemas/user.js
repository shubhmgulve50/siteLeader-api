import Joi from 'joi';
import { GENDER, PROFESSION_TYPE, JOB_TYPE } from '../constants/constants.js';

import { S3Upload } from '../constants/s3Upload.js';

const personalInfoSchema = Joi.object({
  dob: Joi.date().required(),
  timeOfBirth: Joi.string().required(),
  placeOfBirth: Joi.string().required(),
  gender: Joi.number()
    .valid(...Object.values(GENDER))
    .required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  religion: Joi.string().required(),
  caste: Joi.string().required(),
  physicalChallenge: Joi.string().allow(''),
  bloodGroup: Joi.string().allow(''),
  color: Joi.string().allow(''),
  height: Joi.number().allow(''),
  weight: Joi.number().allow(''),
});

const educationSchema = Joi.object({
  highestQualification: Joi.string().allow(''),
  institution: Joi.string().allow(''),
  fieldOfStudy: Joi.string().allow(''),
  yearOfPassing: Joi.string().allow(''),
});

const professionalInfoSchema = Joi.object({
  professionType: Joi.string()
    .valid(...Object.values(PROFESSION_TYPE))
    .optional()
    .messages({
      'any.only': `Profession type must be one of: ${Object.values(PROFESSION_TYPE).join(', ')}`,
    }),
  // Job specific fields
  jobType: Joi.string()
    .valid(...Object.values(JOB_TYPE))
    .optional(),
  company: Joi.string().allow(''),
  designation: Joi.string().allow(''),
  experienceYears: Joi.number().allow(null),
  jobLocation: Joi.string().allow(''),
  // Government specific fields
  department: Joi.string().allow(''),
  positionLevel: Joi.string().allow(''),
  // Corporate specific fields
  industry: Joi.string().allow(''),
  // Business specific fields
  businessType: Joi.string().allow(''),
  businessName: Joi.string().allow(''),
  businessLocation: Joi.string().allow(''),
  // Farmer specific fields
  farmLocation: Joi.string().allow(''),
  // Legacy location field (for backward compatibility - will be cleaned)
  location: Joi.string().allow(''),
})
  .custom((value, helpers) => {
    // Only validate if profession type is selected
    if (!value.professionType || value.professionType === '') {
      return value; // Skip validation if no profession type selected
    }

    // Validate based on profession type
    if (value.professionType === PROFESSION_TYPE.job) {
      if (!value.jobType) {
        return helpers.error('custom.jobTypeRequired');
      }

      // Validate based on job type
      if (value.jobType === JOB_TYPE.government) {
        if (!value.department) {
          return helpers.error('custom.departmentRequired');
        }
        if (!value.positionLevel) {
          return helpers.error('custom.positionLevelRequired');
        }
      } else if (value.jobType === JOB_TYPE.corporate) {
        if (!value.industry) {
          return helpers.error('custom.industryRequired');
        }
        if (!value.company) {
          return helpers.error('custom.companyRequired');
        }
      }

      // Common validations for all job types
      if (!value.designation || value.designation === '') {
        return helpers.error('custom.designationRequired');
      }
      if (value.experienceYears === undefined || value.experienceYears === null) {
        return helpers.error('custom.experienceYearsRequired');
      }
      if (!value.jobLocation || value.jobLocation === '') {
        return helpers.error('custom.jobLocationRequired');
      }
    } else if (value.professionType === PROFESSION_TYPE.business) {
      if (!value.businessType || value.businessType === '') {
        return helpers.error('custom.businessTypeRequired');
      }
      if (!value.businessName || value.businessName === '') {
        return helpers.error('custom.businessNameRequired');
      }
      if (!value.businessLocation || value.businessLocation === '') {
        return helpers.error('custom.businessLocationRequired');
      }
    } else if (value.professionType === PROFESSION_TYPE.farmer) {
      if (!value.farmLocation || value.farmLocation === '') {
        return helpers.error('custom.farmLocationRequired');
      }
    }

    return value;
  })
  .messages({
    'custom.jobTypeRequired': 'Job type is required',
    'custom.departmentRequired': 'Department is required for government job',
    'custom.positionLevelRequired': 'Position level is required for government job',
    'custom.industryRequired': 'Industry is required for corporate job',
    'custom.companyRequired': 'Company name is required for corporate job',
    'custom.designationRequired': 'Designation is required for job',
    'custom.experienceYearsRequired': 'Years of experience is required for job',
    'custom.jobLocationRequired': 'Work location is required for job',
    'custom.businessTypeRequired': 'Business type is required',
    'custom.businessNameRequired': 'Business name is required',
    'custom.businessLocationRequired': 'Business location is required',
    'custom.farmLocationRequired': 'Farm location is required',
  });

const familyMemberSchema = Joi.object({
  name: Joi.string().required(),
  relation: Joi.string().required(),
  occupation: Joi.string().allow(''),
});

const familyInfoSchema = Joi.object({
  members: Joi.array().items(familyMemberSchema),
  additionalDetails: Joi.string().allow(''),
});

const partnerExpectationsSchema = Joi.object({
  preferredEducation: Joi.string().allow(''),
  preferredProfession: Joi.string().allow(''),
  ageRange: Joi.object({
    min: Joi.number(),
    max: Joi.number(),
  }),
  heightRange: Joi.object({
    min: Joi.number(),
    max: Joi.number(),
  }),

  lifestylePreferences: Joi.string().allow(''),
  otherPreferences: Joi.string().allow(''),
});

export const createUserSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  personalInfo: personalInfoSchema.required(),
  education: educationSchema,
  professionalInfo: professionalInfoSchema,
  familyInfo: familyInfoSchema,
  hobbiesAndInterests: Joi.array().items(Joi.string()),
  personalityTraits: Joi.string().allow(''),
  partnerExpectations: partnerExpectationsSchema,
  isActive: Joi.boolean().default(true),
  profilePictureFile: Joi.object({
    type: Joi.string()
      .required()
      .valid(...S3Upload.allowedImageFileTypes)
      .messages({
        'string.empty': 'File type is required',
        'any.only': 'File type is not allowed. Only image files are allowed',
      }),
    ext: Joi.string()
      .required()
      .valid(...S3Upload.allowedImageFileExtensions)
      .messages({
        'string.empty': 'File extension is required',
        'any.only': `Invalid file extension. Only ${S3Upload.allowedImageFileExtensions.join(', ')} are allowed`,
      }),
  }),
  documentFiles: Joi.array()
    .min(S3Upload.minimumDocumentCount)
    .items(
      Joi.object({
        type: Joi.string()
          .required()
          .valid(...S3Upload.allowedDocumentFileTypes)
          .messages({
            'string.empty': 'File type is required',
            'any.only': 'File type is not allowed. Only image files are allowed',
          }),
        ext: Joi.string()
          .required()
          .valid(...S3Upload.allowedDocumentFileExtensions)
          .messages({
            'string.empty': 'File extension is required',
            'any.only': `Invalid file extension. Only ${S3Upload.allowedImageFileExtensions.join(', ')} are allowed`,
          }),
      })
        .optional()
        .messages({
          'array.min': `At least ${S3Upload.minimumDocumentCount} document is required`,
        })
    ),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
  personalInfo: personalInfoSchema,
  education: educationSchema,
  professionalInfo: professionalInfoSchema,
  familyInfo: familyInfoSchema,
  hobbiesAndInterests: Joi.array().items(Joi.string()),
  personalityTraits: Joi.string(),
  partnerExpectations: partnerExpectationsSchema,
  isActive: Joi.boolean(),
}).min(1); // Require at least one field to be present when updating
