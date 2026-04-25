import jwt from 'jsonwebtoken';

const generateToken = (res, userId, role, builderId) => {
  const payload = {
    userId,
    role,
    builderId,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '7d',
  });

  return token;
};

export default generateToken;
