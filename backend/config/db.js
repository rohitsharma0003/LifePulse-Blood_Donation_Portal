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
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blood_donation_db';

  if (!process.env.MONGO_URI) {
    console.warn('\n⚠️  [MONGO_URI NOT SET]: process.env.MONGO_URI is undefined!');
    console.warn('   If running on Render, add MONGO_URI in your Render Dashboard -> Environment.\n');
  } else {
    const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`[MongoDB] Initializing connection to: ${maskedUri}`);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000
    });
    console.log(`✅ [MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ [MongoDB Connection Error] ${error.message}`);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('EACCES') || error.message.includes('buffering timed out')) {
      console.log('\n================================================================');
      console.log('💡 DATABASE CONNECTION CHECKLIST:');
      console.log('1. RENDER DASHBOARD:');
      console.log('   Ensure MONGO_URI is added in Environment Variables:');
      console.log('   MONGO_URI=mongodb+srv://rohitmpc2004_db_user:rohitdb@cluster0.8sh8j84.mongodb.net/blood_donation_db?retryWrites=true&w=majority');
      console.log('2. MONGODB ATLAS NETWORK ACCESS:');
      console.log('   Render uses dynamic cloud IPs. In Atlas -> Network Access,');
      console.log('   ensure 0.0.0.0/0 (Allow Access from Anywhere) is active.');
      console.log('================================================================\n');
    }
  }
};

export default connectDB;
