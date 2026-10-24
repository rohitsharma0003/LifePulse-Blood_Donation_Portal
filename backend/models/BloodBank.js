import mongoose from 'mongoose';

const bloodBankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide blood bank name'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide blood bank contact phone'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Please provide blood bank address'],
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      // GeoJSON standard: [longitude, latitude]
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates [longitude, latitude] are required']
      }
    },
    // Map of blood groups to unit counts e.g. { 'A+': 12, 'O+': 20, ... }
    inventory: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// 2DSphere geospatial index on location
bloodBankSchema.index({ location: '2dsphere' });

const BloodBank = mongoose.model('BloodBank', bloodBankSchema);

export default BloodBank;
