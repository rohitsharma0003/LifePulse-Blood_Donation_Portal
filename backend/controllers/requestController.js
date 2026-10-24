import BloodRequest from '../models/BloodRequest.js';
import BloodBank from '../models/BloodBank.js';
import User from '../models/User.js';
import DonationResponse from '../models/DonationResponse.js';
import { sendWhatsappAlert } from '../services/whatsappService.js';

/**
 * Helper to calculate Haversine distance between two [longitude, latitude] points in km
 */
const calculateDistanceInKm = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) return 0;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

/**
 * Create a new blood request and trigger automated WhatsApp alerts to nearby matching donors
 * POST /api/requests
 */
export const createRequestAndNotify = async (req, res) => {
  try {
    const { bloodGroupNeeded, unitsNeeded, hospitalAddress, hospitalCoordinates } = req.body;

    if (!bloodGroupNeeded || !hospitalAddress || !hospitalCoordinates) {
      return res.status(400).json({
        success: false,
        message: 'bloodGroupNeeded, hospitalAddress, and hospitalCoordinates are required.'
      });
    }

    // Validate hospitalCoordinates: [longitude, latitude]
    if (!Array.isArray(hospitalCoordinates) || hospitalCoordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'hospitalCoordinates must be an array of [longitude, latitude].'
      });
    }

    const lng = parseFloat(hospitalCoordinates[0]);
    const lat = parseFloat(hospitalCoordinates[1]);

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate values for hospitalCoordinates.'
      });
    }

    const validCoordinates = [lng, lat];

    // 1. Create and store BloodRequest
    const newRequest = await BloodRequest.create({
      requesterId: req.user._id,
      bloodGroupNeeded,
      unitsNeeded: parseInt(unitsNeeded, 10) || 1,
      hospitalAddress: hospitalAddress.trim(),
      hospitalCoordinates: validCoordinates,
      status: 'OPEN'
    });

    // 2. Query matching individual donors within 15 km (15,000 meters)
    // Matches blood group, isDonorAvailable: true, and excludes the requester
    let matchingDonors = [];
    try {
      matchingDonors = await User.find({
        _id: { $ne: req.user._id },
        isDonorAvailable: true,
        bloodGroup: bloodGroupNeeded,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: validCoordinates
            },
            $maxDistance: 15000 // 15 km in meters
          }
        }
      });
    } catch (geoErr) {
      console.warn('[Geospatial Query Notice]: Falling back if index building:', geoErr.message);
      // Fallback in case 2dsphere index is warming up
      const allMatching = await User.find({
        _id: { $ne: req.user._id },
        isDonorAvailable: true,
        bloodGroup: bloodGroupNeeded
      });
      matchingDonors = allMatching.filter((donor) => {
        const dist = calculateDistanceInKm(validCoordinates, donor.location.coordinates);
        return dist <= 15.0;
      });
    }

    // 3. Query nearby blood banks
    let nearbyBanks = [];
    try {
      nearbyBanks = await BloodBank.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: validCoordinates
            },
            $maxDistance: 30000 // 30 km radius for blood banks
          }
        }
      });
    } catch (bankGeoErr) {
      console.warn('[BloodBank Geospatial Notice]:', bankGeoErr.message);
      nearbyBanks = await BloodBank.find({});
    }

    // Format nearby blood banks with calculated distance
    const formattedBanks = nearbyBanks.map((bank) => {
      const distanceKm = calculateDistanceInKm(validCoordinates, bank.location.coordinates);
      const stockForGroup = bank.inventory ? (bank.inventory.get ? bank.inventory.get(bloodGroupNeeded) : bank.inventory[bloodGroupNeeded]) || 0 : 0;
      return {
        _id: bank._id,
        name: bank.name,
        phone: bank.phone,
        address: bank.address,
        location: bank.location,
        distanceKm,
        availableUnitsForGroup: stockForGroup,
        inventory: bank.inventory
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    // 4. Create PENDING DonationResponse records for all matching donors
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const responseRecords = [];

    for (const donor of matchingDonors) {
      const responseDoc = await DonationResponse.findOneAndUpdate(
        {
          requestId: newRequest._id,
          donorId: donor._id
        },
        {
          status: 'PENDING',
          respondedAt: null
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
      responseRecords.push(responseDoc);

      // 5. Send automated WhatsApp message
      const acceptLink = `${frontendUrl}/respond?req=${newRequest._id}&donor=${donor._id}&action=accept`;
      const declineLink = `${frontendUrl}/respond?req=${newRequest._id}&donor=${donor._id}&action=decline`;

      const distanceKm = calculateDistanceInKm(validCoordinates, donor.location.coordinates);

      const alertMessage =
        `🚨 *URGENT BLOOD DONATION REQUEST* 🚨\n\n` +
        `Hello *${donor.name}*,\n` +
        `A patient urgently requires *${bloodGroupNeeded}* blood (${newRequest.unitsNeeded} unit(s)).\n\n` +
        `🏥 *Hospital:* ${hospitalAddress}\n` +
        `📍 *Approx Distance:* ~${distanceKm} km from you\n` +
        `👤 *Requester:* ${req.user.name}\n\n` +
        `🔒 *Consent-First Privacy:* Your phone number and identity remain completely masked until you choose to accept this request.\n\n` +
        `👉 *TAP TO ACCEPT (Share Contact):*\n${acceptLink}\n\n` +
        `❌ *TAP TO DECLINE:*\n${declineLink}\n\n` +
        `Thank you for helping save lives! ❤️`;

      // Non-blocking trigger to allow swift API response
      sendWhatsappAlert(donor.phone, alertMessage).catch((err) =>
        console.error(`[WhatsApp Dispatch Error for ${donor.phone}]:`, err.message)
      );
    }

    return res.status(201).json({
      success: true,
      message: `Request created. ${matchingDonors.length} nearby donors notified via WhatsApp.`,
      request: newRequest,
      notifiedDonorsCount: matchingDonors.length,
      nearbyBanks: formattedBanks
    });
  } catch (error) {
    console.error('[Create Request Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating blood request.'
    });
  }
};

/**
 * Return list of donors who have explicitly marked status as 'ACCEPTED'.
 * Contact details (name, phone, bloodGroup, location) are ONLY exposed here.
 * GET /api/requests/:id/accepted-donors
 */
export const getAcceptedDonors = async (req, res) => {
  try {
    const { id } = req.params;

    const bloodRequest = await BloodRequest.findById(id);
    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.'
      });
    }

    // Retrieve all responses for this request
    const allResponses = await DonationResponse.find({ requestId: id })
      .populate('donorId', 'name phone bloodGroup location');

    const totalNotified = allResponses.length;
    const acceptedList = allResponses.filter((r) => r.status === 'ACCEPTED' && r.donorId);
    const pendingCount = allResponses.filter((r) => r.status === 'PENDING').length;
    const declinedCount = allResponses.filter((r) => r.status === 'DECLINED').length;

    const acceptedDonors = acceptedList.map((item) => {
      const distanceKm = calculateDistanceInKm(
        bloodRequest.hospitalCoordinates,
        item.donorId.location.coordinates
      );

      return {
        responseId: item._id,
        status: item.status,
        respondedAt: item.respondedAt,
        donor: {
          _id: item.donorId._id,
          name: item.donorId.name,
          phone: item.donorId.phone,
          bloodGroup: item.donorId.bloodGroup,
          location: item.donorId.location,
          distanceKm
        }
      };
    });

    return res.status(200).json({
      success: true,
      request: bloodRequest,
      stats: {
        totalNotified,
        pendingCount,
        acceptedCount: acceptedDonors.length,
        declinedCount
      },
      acceptedDonors
    });
  } catch (error) {
    console.error('[Get Accepted Donors Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching accepted donors.'
    });
  }
};

/**
 * Return blood banks near the request's hospital coordinates with available stock
 * GET /api/requests/:id/nearby-banks
 */
export const getNearbyBanks = async (req, res) => {
  try {
    const { id } = req.params;

    const bloodRequest = await BloodRequest.findById(id);
    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.'
      });
    }

    const { hospitalCoordinates, bloodGroupNeeded } = bloodRequest;

    let banks = [];
    try {
      banks = await BloodBank.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: hospitalCoordinates
            },
            $maxDistance: 50000 // 50 km
          }
        }
      });
    } catch (geoErr) {
      console.warn('[BloodBank Find Warning]:', geoErr.message);
      banks = await BloodBank.find({});
    }

    const formatted = banks.map((bank) => {
      const distanceKm = calculateDistanceInKm(hospitalCoordinates, bank.location.coordinates);
      const unitsInStock = bank.inventory
        ? (bank.inventory.get ? bank.inventory.get(bloodGroupNeeded) : bank.inventory[bloodGroupNeeded]) || 0
        : 0;

      return {
        _id: bank._id,
        name: bank.name,
        phone: bank.phone,
        address: bank.address,
        location: bank.location,
        distanceKm,
        availableUnitsForGroup: unitsInStock,
        inventory: bank.inventory
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      bloodGroupNeeded,
      bloodBanks: formatted
    });
  } catch (error) {
    console.error('[Get Nearby Banks Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching nearby blood banks.'
    });
  }
};

/**
 * Retrieve all blood requests created by currently authenticated user
 * GET /api/requests/my-requests
 */
export const getUserRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requesterId: req.user._id }).sort({ createdAt: -1 });

    const requestsWithStats = await Promise.all(
      requests.map(async (request) => {
        const totalNotified = await DonationResponse.countDocuments({ requestId: request._id });
        const acceptedCount = await DonationResponse.countDocuments({
          requestId: request._id,
          status: 'ACCEPTED'
        });

        return {
          ...request.toObject(),
          totalNotified,
          acceptedCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      requests: requestsWithStats
    });
  } catch (error) {
    console.error('[Get User Requests Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while retrieving requests.'
    });
  }
};

/**
 * Retrieve single request details
 * GET /api/requests/:id
 */
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id).populate('requesterId', 'name phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    const totalNotified = await DonationResponse.countDocuments({ requestId: id });
    const acceptedCount = await DonationResponse.countDocuments({
      requestId: id,
      status: 'ACCEPTED'
    });

    return res.status(200).json({
      success: true,
      request: {
        ...request.toObject(),
        totalNotified,
        acceptedCount
      }
    });
  } catch (error) {
    console.error('[Get Request By Id Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching request.'
    });
  }
};
