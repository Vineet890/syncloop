const mongoose = require('mongoose');

const connectDB = () => {
    if (process.env.NODE_ENV !== 'test') {
        mongoose.connect(process.env.MONGODB_URI)
          .then(() => console.log('Successfully connected to MongoDB Cloud!'))
          .catch(err => console.error('MongoDB connection error:', err));
    }
};

module.exports = connectDB;
