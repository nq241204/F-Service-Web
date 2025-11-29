// config/db.js (Phiên bản đã tối ưu)
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Force use MongoDB Atlas URI, disable fallback
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        console.log('🔗 Connecting to MongoDB...');
        
        await mongoose.connect(mongoURI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            autoIndex: process.env.NODE_ENV !== 'production'
        });
        
        console.log('✅ Kết nối MongoDB Atlas thành công');
        console.log('🗄️  Database:', mongoose.connection.name);
        
    } catch (error) {
        console.error('❌ MongoDB Atlas connection error:', error);
        console.error('🔧 Please check:');
        console.error('   1. MONGODB_URI in .env file');
        console.error('   3. MongoDB Atlas access');
        process.exit(1); 
    }
};

module.exports = connectDB;