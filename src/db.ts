import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        
        await mongoose.connect(process.env.MONGODB_URL || 'mongodb+srv://alan:1234@sw.blior6z.mongodb.net/chat?retryWrites=true&w=majority');
        console.log('MongoDB connected...');
    } catch (err:any) {
        console.error(err.message);
        process.exit(1);
    }
};

export default connectDB;