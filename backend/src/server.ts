import 'dotenv/config';
import app from './src/app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Kerabat Modular Backend is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
