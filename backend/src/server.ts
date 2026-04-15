import 'dotenv/config';
import app from './app.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db } from './db/index.js';

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Kerabat Modular Backend is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
