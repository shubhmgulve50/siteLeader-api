import serverlessExpress from '@codegenie/serverless-express';
import app from './index.js';

export const handler = serverlessExpress({ app });
