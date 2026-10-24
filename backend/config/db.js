import dns from 'dns';
import mongoose from 'mongoose';

// Prevent local querySrv ECONNREFUSED issues by enforcing IPv4 resolution first and fallback public DNS
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore in environments where custom DNS servers cannot be set
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blood_donation_db');
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ [MongoDB Connection Error] ${error.message}`);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('EACCES')) {
      console.log('\n================================================================');
      console.log('💡 MONGODB NOT DETECTED ON PORT 27017:');
      console.log('1. Using MongoDB Atlas (Cloud - Recommended):');
      console.log('   Set MONGO_URI in backend/.env to your Atlas connection string:');
      console.log('   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/blood_donation_db');
      console.log('2. Using Local MongoDB on Windows:');
      console.log('   Run: net start MongoDB (or mongod --dbpath "C:\\data\\db")');
      console.log('================================================================\n');
    }
  }
};

export default connectDB;
