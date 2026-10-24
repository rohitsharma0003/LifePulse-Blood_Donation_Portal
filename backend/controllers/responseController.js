import DonationResponse from '../models/DonationResponse.js';
import BloodRequest from '../models/BloodRequest.js';
import User from '../models/User.js';

/**
 * Handle donor response (ACCEPT or DECLINE) triggered from WhatsApp link
 * POST /api/responses/respond
 */
export const handleDonorResponse = async (req, res) => {
  try {
    const { requestId, donorId, action } = req.body;

    if (!requestId || !donorId) {
      return res.status(400).json({
        success: false,
        message: 'requestId and donorId are required.'
      });
    }

    const normalizedAction = (action || '').toUpperCase();
    let statusToSet = 'ACCEPTED';

    if (normalizedAction === 'DECLINE' || normalizedAction === 'DECLINED') {
      statusToSet = 'DECLINED';
    } else if (normalizedAction === 'ACCEPT' || normalizedAction === 'ACCEPTED') {
      statusToSet = 'ACCEPTED';
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'accept' or 'decline'."
      });
    }

    // Verify request exists
    const requestDoc = await BloodRequest.findById(requestId).populate('requesterId', 'name phone');
    if (!requestDoc) {
      return res.status(404).json({
        success: false,
        message: 'The requested blood emergency record was not found or has expired.'
      });
    }

    // Verify donor exists
    const donorDoc = await User.findById(donorId);
    if (!donorDoc) {
      return res.status(404).json({
        success: false,
        message: 'Donor account not found.'
      });
    }

    // Find and update donation response record
    const updatedResponse = await DonationResponse.findOneAndUpdate(
      {
        requestId,
        donorId
      },
      {
        status: statusToSet,
        respondedAt: new Date()
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    const isAccepted = statusToSet === 'ACCEPTED';

    return res.status(200).json({
      success: true,
      status: statusToSet,
      message: isAccepted
        ? 'Thank you! You have accepted the blood donation request. Your contact details have now been securely unmasked for the requester.'
        : 'You have declined this request. Your contact information remains completely masked.',
      response: updatedResponse,
      request: {
        bloodGroupNeeded: requestDoc.bloodGroupNeeded,
        unitsNeeded: requestDoc.unitsNeeded,
        hospitalAddress: requestDoc.hospitalAddress,
        requesterName: requestDoc.requesterId?.name || 'Authorized Requester',
        requesterPhone: isAccepted ? requestDoc.requesterId?.phone : null
      }
    });
  } catch (error) {
    console.error('[Handle Donor Response Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while processing donation response.'
    });
  }
};

/**
 * Retrieve public details for a donation response landing page
 * GET /api/responses/details?req=:requestId&donor=:donorId
 */
export const getResponseDetails = async (req, res) => {
  try {
    const { req: requestId, donor: donorId } = req.query;

    if (!requestId || !donorId) {
      return res.status(400).json({
        success: false,
        message: 'req (requestId) and donor (donorId) query parameters are required.'
      });
    }

    const requestDoc = await BloodRequest.findById(requestId).populate('requesterId', 'name phone');
    if (!requestDoc) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.'
      });
    }

    const donorDoc = await User.findById(donorId).select('name bloodGroup phone');
    if (!donorDoc) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found.'
      });
    }

    const existingResponse = await DonationResponse.findOne({
      requestId,
      donorId
    });

    return res.status(200).json({
      success: true,
      request: {
        _id: requestDoc._id,
        bloodGroupNeeded: requestDoc.bloodGroupNeeded,
        unitsNeeded: requestDoc.unitsNeeded,
        hospitalAddress: requestDoc.hospitalAddress,
        status: requestDoc.status,
        createdAt: requestDoc.createdAt,
        requesterName: requestDoc.requesterId?.name || 'Emergency Requester',
        requesterPhone: existingResponse?.status === 'ACCEPTED' ? requestDoc.requesterId?.phone : null
      },
      donor: {
        _id: donorDoc._id,
        name: donorDoc.name,
        bloodGroup: donorDoc.bloodGroup
      },
      currentStatus: existingResponse ? existingResponse.status : 'PENDING',
      respondedAt: existingResponse ? existingResponse.respondedAt : null
    });
  } catch (error) {
    console.error('[Get Response Details Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching response details.'
    });
  }
};
