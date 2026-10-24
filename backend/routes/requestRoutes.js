import express from 'express';
import {
  createRequestAndNotify,
  getAcceptedDonors,
  getNearbyBanks,
  getUserRequests,
  getRequestById
} from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createRequestAndNotify);
router.get('/my-requests', protect, getUserRequests);
router.get('/:id', protect, getRequestById);
router.get('/:id/accepted-donors', protect, getAcceptedDonors);
router.get('/:id/nearby-banks', protect, getNearbyBanks);

export default router;
