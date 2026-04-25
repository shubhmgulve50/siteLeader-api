import Joi from 'joi';

export const checkEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});
