import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bloodGroupNeeded: {
      type: String,
      required: [true, 'Please specify blood group needed'],
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        message: '{VALUE} is not a valid blood group'
      }
    },
    unitsNeeded: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Must need at least 1 unit']
    },
    hospitalAddress: {
      type: String,
      required: [true, 'Please provide hospital name and address'],
      trim: true
    },
    // GeoJSON standard: [longitude, latitude]
    hospitalCoordinates: {
      type: [Number],
      required: [true, 'Hospital coordinates [longitude, latitude] are required']
    },
    status: {
      type: String,
      enum: ['OPEN', 'FULFILLED', 'CANCELLED'],
      default: 'OPEN'
    }
  },
  {
    timestamps: true
  }
);

// 2DSphere geospatial index on hospitalCoordinates
bloodRequestSchema.index({ hospitalCoordinates: '2dsphere' });

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

export default BloodRequest;
