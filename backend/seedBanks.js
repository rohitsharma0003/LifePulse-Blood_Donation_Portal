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
  /* ---------------- HYDERABAD BLOOD BANKS ---------------- */
  {
    name: 'Red Cross Blood Bank - Vidyanagar',
    phone: '+914027633087',
    address: 'Red Cross Building, Vidyanagar, Adikmet, Hyderabad, Telangana 500044',
    location: {
      type: 'Point',
      // GeoJSON: [longitude, latitude]
      coordinates: [78.5085, 17.3984]
    },
    inventory: {
      'A+': 32,
      'A-': 8,
      'B+': 45,
      'B-': 12,
      'AB+': 16,
      'AB-': 5,
      'O+': 55,
      'O-': 14
    }
  },
  {
    name: 'NTR Memorial Trust Blood Bank - Banjara Hills',
    phone: '+914030145555',
    address: 'Road No. 2, Banjara Hills, Hyderabad, Telangana 500034',
    location: {
      type: 'Point',
      // GeoJSON: [longitude, latitude]
      coordinates: [78.4350, 17.4168]
    },
    inventory: {
      'A+': 28,
      'A-': 6,
      'B+': 38,
      'B-': 9,
      'AB+': 14,
      'AB-': 4,
      'O+': 48,
      'O-': 11
    }
  },
  {
    name: 'Chiranjeevi Charitable Blood Bank - Jubilee Hills',
    phone: '+914023554444',
    address: 'Road No. 1, Jubilee Hills, Near Check Post, Hyderabad, Telangana 500033',
    location: {
      type: 'Point',
      // GeoJSON: [longitude, latitude]
      coordinates: [78.4116, 17.4325]
    },
    inventory: {
      'A+': 25,
      'A-': 7,
      'B+': 34,
      'B-': 8,
      'AB+': 11,
      'AB-': 3,
      'O+': 42,
      'O-': 9
    }
  },
  {
    name: 'Osmania General Hospital Blood Bank - Afzal Gunj',
    phone: '+914024600121',
    address: 'Afzal Gunj, High Court Road, Hyderabad, Telangana 500012',
    location: {
      type: 'Point',
      // GeoJSON: [longitude, latitude]
      coordinates: [78.4739, 17.3753]
    },
    inventory: {
      'A+': 20,
      'A-': 4,
      'B+': 26,
      'B-': 6,
      'AB+': 8,
      'AB-': 2,
      'O+': 36,
      'O-': 7
    }
  },
  {
    name: 'KIMS Hospitals Blood Centre - Secunderabad',
    phone: '+914044885000',
    address: '1-8-31/1, Minister Road, Begumpet, Secunderabad, Hyderabad, Telangana 500003',
    location: {
      type: 'Point',
      // GeoJSON: [longitude, latitude]
      coordinates: [78.4876, 17.4385]
    },
    inventory: {
      'A+': 18,
      'A-': 5,
      'B+': 24,
      'B-': 5,
      'AB+': 9,
      'AB-': 3,
      'O+': 30,
      'O-': 6
    }
  },
  {
    name: 'Apollo Hospitals Blood Bank - Jubilee Hills',
    phone: '+914023607777',
    address: 'Road No. 72, Opp Bharatiya Vidya Bhavan School, Jubilee Hills, Hyderabad, Telangana 500033',
    location: {
      type: 'Point',
      // GeoJSON: [longitude, latitude]
      coordinates: [78.4138, 17.4239]
    },
    inventory: {
      'A+': 22,
      'A-': 6,
      'B+': 30,
      'B-': 7,
      'AB+': 12,
      'AB-': 4,
      'O+': 40,
      'O-': 8
    }
  },

  /* ---------------- BENGALURU BLOOD BANKS ---------------- */
  {
    name: 'City Central Red Cross Blood Bank',
    phone: '+919876543210',
    address: '12 Healthcare Avenue, Central District, Bengaluru, Karnataka',
    location: {
      type: 'Point',
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
    address: '88 Ring Road, Medical Enclave, Bengaluru, Karnataka',
    location: {
      type: 'Point',
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
    address: '45 South Boulevard, Near City Civil Hospital, Bengaluru, Karnataka',
    location: {
      type: 'Point',
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
    console.log(`Connecting to MongoDB for seeding: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing blood banks...');
    await BloodBank.deleteMany({});

    console.log(`Inserting ${sampleBloodBanks.length} blood banks (including Hyderabad & Bengaluru)...`);
    const inserted = await BloodBank.insertMany(sampleBloodBanks);

    console.log(`\n✅ Successfully seeded ${inserted.length} blood banks:`);
    inserted.forEach((bank, index) => {
      console.log(`  ${index + 1}. ${bank.name}`);
      console.log(`     📍 Address: ${bank.address}`);
      console.log(`     🌐 Coordinates: [${bank.location.coordinates.join(', ')}] | 📞 Phone: ${bank.phone}`);
    });

    console.log('\nSeeding completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error.message);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('EACCES')) {
      console.log('\n================================================================');
      console.log('💡 HOW TO RESOLVE THIS:');
      console.log('1. Check backend/.env MONGO_URI.');
      console.log('2. Ensure MongoDB Atlas IP Whitelist (0.0.0.0/0) is active.');
      console.log('================================================================\n');
    }
    process.exit(1);
  }
};

seedBloodBanks();
