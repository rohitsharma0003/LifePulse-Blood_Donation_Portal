import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import BloodBank from './models/BloodBank.js';

dotenv.config();

// Enforce IPv4 resolution first and reliable DNS servers for SRV resolution
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore if unsupported
}

const sampleBloodBanks = [
  {
    name: 'City Central Red Cross Blood Bank',
    phone: '+919876543210',
    address: '12 Healthcare Avenue, Central District, Bengaluru',
    location: {
      type: 'Point',
      // [longitude, latitude]
      coordinates: [77.5946, 12.9716]
    },
    inventory: {
      'A+': 24,
      'A-': 6,
      'B+': 30,
      'B-': 8,
      'AB+': 12,
      'AB-': 4,
      'O+': 42,
      'O-': 10
    }
  },
  {
    name: 'Metro Lifeline Blood Centre',
    phone: '+919876543211',
    address: '88 Ring Road, Medical Enclave, Bengaluru',
    location: {
      type: 'Point',
      // [longitude, latitude]
      coordinates: [77.6050, 12.9800]
    },
    inventory: {
      'A+': 15,
      'A-': 3,
      'B+': 18,
      'B-': 5,
      'AB+': 7,
      'AB-': 2,
      'O+': 29,
      'O-': 6
    }
  },
  {
    name: 'Apex Care Charitable Blood Bank',
    phone: '+919876543212',
    address: '45 South Boulevard, Near City Civil Hospital, Bengaluru',
    location: {
      type: 'Point',
      // [longitude, latitude]
      coordinates: [77.5800, 12.9600]
    },
    inventory: {
      'A+': 10,
      'A-': 2,
      'B+': 22,
      'B-': 4,
      'AB+': 5,
      'AB-': 1,
      'O+': 16,
      'O-': 5
    }
  }
];

const seedBloodBanks = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blood_donation_db';
    console.log(`Connecting to MongoDB for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing blood banks...');
    await BloodBank.deleteMany({});

    console.log('Inserting 3 sample blood banks with inventories...');
    const inserted = await BloodBank.insertMany(sampleBloodBanks);

    console.log(`\n✅ Successfully seeded ${inserted.length} sample blood banks:`);
    inserted.forEach((bank, index) => {
      console.log(`  ${index + 1}. ${bank.name} (${bank.address})`);
      console.log(`     Coordinates: [${bank.location.coordinates.join(', ')}] | Phone: ${bank.phone}`);
    });

    console.log('\nSeeding completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error.message);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('EACCES')) {
      console.log('\n================================================================');
      console.log('💡 HOW TO RESOLVE THIS:');
      console.log('1. OPTION A (Fastest - Free Cloud MongoDB Atlas):');
      console.log('   In backend/.env, update MONGO_URI with your Atlas connection string:');
      console.log('   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/blood_donation_db');
      console.log('   (Our dns.setDefaultResultOrder fix ensures Atlas works smoothly)');
      console.log('\n2. OPTION B (Local Windows Service):');
      console.log('   If MongoDB is installed locally, start the service in PowerShell:');
      console.log('   > net start MongoDB');
      console.log('   Or start the daemon manually:');
      console.log('   > mongod --dbpath "C:\\data\\db"');
      console.log('================================================================\n');
    }
    process.exit(1);
  }
};

seedBloodBanks();
