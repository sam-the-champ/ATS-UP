import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './api/routes/authRoutes';
import userRoutes from './api/routes/userRoutes';
import jobRoutes from './api/routes/jobRoutes';
import applicationRoutes from './api/routes/applicationRoutes';
const app = express();

app.use(helmet()); // Security headers
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);

console.log(process.env.DATABASE_URL);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));