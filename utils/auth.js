import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Generate JWT Token
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET);
};

export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};
