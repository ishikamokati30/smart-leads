import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { errorHandler, notFound } from './middlewares/errorMiddleware';
import authRoutes from './routes/authRoutes';
import leadRoutes from './routes/leadRoutes';

dotenv.config();

// Connect to database
connectDB();

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
