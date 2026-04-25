import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { parseEnvList } from './utils/utils.js';
import * as routes from './routes/index.js';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateContentType } from './middleware/contentTypeValidator.js';

dotenv.config();

const app = express();

// CORS Configuration
const CORS_OPTIONS = {
  origin: parseEnvList(process.env.CORS_ORIGINS),
  credentials: true,
};
app.use(cors(CORS_OPTIONS));

// app.use(express.json());
app.use(cookieParser());
app.use(validateContentType);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// App Routes
app.use('/api/auth', routes.authRoutes);
app.use('/api/sites', routes.siteRoutes);
app.use('/api/labours', routes.labourRoutes);
app.use('/api/finance', routes.financeRoutes);
app.use('/api/materials', routes.materialRoutes);
app.use('/api/quotations', routes.quotationRoutes);
app.use('/api/invoices', routes.invoiceRoutes);
app.use('/api/ra-bills', routes.raBillRoutes);
app.use('/api/labour-advances', routes.labourAdvanceRoutes);
app.use('/api/milestones', routes.milestoneRoutes);
app.use('/api/site-documents', routes.siteDocumentRoutes);
app.use('/api/vendors', routes.vendorRoutes);
app.use('/api/equipment', routes.equipmentRoutes);
app.use('/api/safety-incidents', routes.safetyIncidentRoutes);
app.use('/api/audit-logs', routes.auditLogRoutes);
// Public — no auth required
app.use('/api/portal', routes.clientPortalRoutes);
app.use('/api/admin', routes.adminRoutes);
app.use('/api/example', routes.exampleRoutes);
app.use('/api/super-admin', routes.superAdminRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/health', (req, res) => {
  res.send('OK');
});

const connectDBWithRetry = async (retries = 3, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await connectDB();
      console.log('Database connected successfully');
      break;
    } catch (error) {
      console.error(
        `Database connection failed (Attempt ${attempt} of ${retries}):`,
        error.message
      );

      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error('All retry attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
};

const startServer = async () => {
  try {
    await connectDBWithRetry();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server', error.message);
    process.exit(1);
  }
};

app.use(errorHandler);

startServer();

export default app;
