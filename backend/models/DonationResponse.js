import mongoose from 'mongoose';

const donationResponseSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: true
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING'
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one response state per donor-request pair
donationResponseSchema.index({ requestId: 1, donorId: 1 }, { unique: true });

const DonationResponse = mongoose.model('DonationResponse', donationResponseSchema);

export default DonationResponse;
