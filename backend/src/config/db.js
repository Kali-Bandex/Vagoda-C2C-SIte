const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      const { MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_CLUSTER, MONGODB_APPNAME } = process.env;
      if (!MONGODB_USERNAME || !MONGODB_PASSWORD || !MONGODB_CLUSTER) {
        throw new Error(
          "Missing MongoDB environment variables. Please provide MONGODB_URI or (MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_CLUSTER)."
        );
      }
      const encodedPassword = encodeURIComponent(MONGODB_PASSWORD);
      uri = `mongodb+srv://${MONGODB_USERNAME}:${encodedPassword}@${MONGODB_CLUSTER}/marketplace?appName=${MONGODB_APPNAME || "Numba"}`;
    }

    const conn = await mongoose.connect(uri);
    isConnected = conn.connections[0].readyState === 1;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
