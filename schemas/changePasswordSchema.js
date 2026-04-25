import Joi from 'joi';

export const passwordValidator = Joi.string().min(8).required().messages({
  'string.min': 'Password must be at least 8 characters long',
  'string.empty': 'Password is required',
});

const changePasswordSchema = Joi.object({
  oldPassword: passwordValidator,
  newPassword: passwordValidator,
});
export default changePasswordSchema;
