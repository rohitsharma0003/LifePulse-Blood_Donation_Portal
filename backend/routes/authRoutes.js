import express from 'express';
import {
  register,
  login,
  toggleDonorStatus,
  getMe
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/toggle-donor', protect, toggleDonorStatus);
router.get('/me', protect, getMe);

export default router;
