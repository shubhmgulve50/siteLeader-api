import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

export function parseEnvList(envValue) {
  return envValue?.split(',').map((origin) => origin.trim()) || [];
}

export function messageResponse(res, message, statusCode, data = null) {
  if (!res || typeof res.status !== 'function') {
    console.log(res, 'ssss');
    console.error('Invalid response object passed to messageResponse');
    return;
  }

  const response = { message };
  if (data !== null) response.data = data;

  res.status(statusCode).json(response);
}

export function errorResponse(res, error, data = null) {
  if (!res || typeof res.status !== 'function') {
    console.log(JSON.stringify(res), 'eeee');
    console.error('Invalid response object passed to errorResponse');
    return;
  }

  const { message = 'Something went wrong', statusCode = 500, errorData = null } = error;

  res.status(statusCode).json({
    success: false,
    message,
    errorData,
    data,
  });
}

export const generateUniqueFileNameForS3 = (folder, extension) => {
  return `${folder}/${uuidv4()}-${Date.now()}${extension}`;
};

export const setCookie = (res, name, value, options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const COOKIE_DOMAIN = isProduction ? process.env.COOKIE_DOMAIN : undefined;

  const defaultOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain: COOKIE_DOMAIN,
    path: '/',
  };

  if (options.maxAge) defaultOptions.maxAge = options.maxAge;

  res.cookie(name, value, { ...defaultOptions, ...options });
};

export const getCookie = (req, name) => {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(value);
  }

  return null;
};

export const clearCookie = (res, name, options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const COOKIE_DOMAIN = isProduction ? process.env.COOKIE_DOMAIN : undefined;

  const defaultOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain: COOKIE_DOMAIN,
    path: '/',
    maxAge: 0,
  };

  res.cookie(name, '', { ...defaultOptions, ...options });
};

export const clearAuthCookies = (res) => {
  const tokens = ['accessToken', 'refreshToken'];
  for (const token of tokens) clearCookie(res, token);
};

export function calculateAge(dob) {
  if (!dob) return null;

  const birthDate = moment(dob);
  if (!birthDate.isValid()) {
    throw new Error('Invalid date of birth');
  }

  return moment().diff(birthDate, 'years');
}
