import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'blood_donation_portal_jwt_secret_key_2026_secure',
    { expiresIn: '30d' }
  );
};

/**
 * Register a new user (Single account handles requests and donations)
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, phone, password, bloodGroup, coordinates, isDonorAvailable } = req.body;

    if (!name || !phone || !password || !bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, password, and blood group are required.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ phone: phone.trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number is already registered.'
      });
    }

    // Validate coordinates: [longitude, latitude]
    let parsedCoordinates;
    if (Array.isArray(coordinates) && coordinates.length === 2) {
      const lng = parseFloat(coordinates[0]);
      const lat = parseFloat(coordinates[1]);
      if (isNaN(lng) || isNaN(lat)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinate numbers provided. Must be [longitude, latitude].'
        });
      }
      parsedCoordinates = [lng, lat];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be an array of [longitude, latitude].'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with GeoJSON Point
    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      password: hashedPassword,
      bloodGroup,
      isDonorAvailable: typeof isDonorAvailable === 'boolean' ? isDonorAvailable : true,
      location: {
        type: 'Point',
        coordinates: parsedCoordinates
      }
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        isDonorAvailable: user.isDonorAvailable,
        location: user.location
      }
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
};

/**
 * Authenticate existing user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and password.'
      });
    }

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password.'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        isDonorAvailable: user.isDonorAvailable,
        location: user.location
      }
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.'
    });
  }
};

/**
 * Toggle user's donor availability status
 * PUT /api/auth/toggle-donor
 */
export const toggleDonorStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    user.isDonorAvailable = !user.isDonorAvailable;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Donor availability updated to ${user.isDonorAvailable ? 'Available' : 'Unavailable'}`,
      isDonorAvailable: user.isDonorAvailable
    });
  } catch (error) {
    console.error('[Toggle Donor Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while toggling donor status.'
    });
  }
};

/**
 * Get currently authenticated user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('[GetMe Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile.'
    });
  }
};
