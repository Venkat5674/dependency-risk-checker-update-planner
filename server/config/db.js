const mongoose = require("mongoose");

const connectDB = async () => {
    if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.trim()) {
        throw new Error("MONGODB_URI is required before connecting to MongoDB.");
    }

    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "depsafe",
            serverSelectionTimeoutMS: 10000,
        });
        console.log(`Connected to MongoDB [${connection.connection.name}] : ${connection.connection.host}`);
        return connection;
    } catch (error) {
        throw new Error(`MongoDB connection failed: ${error.message}`);
    }
};

module.exports = connectDB;