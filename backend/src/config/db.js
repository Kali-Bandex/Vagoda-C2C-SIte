const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const { MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_CLUSTER, MONGODB_APPNAME } = process.env;

    if (!MONGODB_USERNAME || !MONGODB_PASSWORD || !MONGODB_CLUSTER) {
      throw new Error("Missing MongoDB environment variables");
    }

    const encodedPassword = encodeURIComponent(MONGODB_PASSWORD);
    const uri = `mongodb+srv://${MONGODB_USERNAME}:${encodedPassword}@${MONGODB_CLUSTER}/marketplace?appName=${MONGODB_APPNAME || "Numba"}`;

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
