import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password']
    },
    bloodGroup: {
      type: String,
      required: [true, 'Please provide blood group'],
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        message: '{VALUE} is not a valid blood group'
      }
    },
    isDonorAvailable: {
      type: Boolean,
      default: true
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
    }
  },
  {
    timestamps: true
  }
);

// 2DSphere geospatial index on location
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

export default User;
