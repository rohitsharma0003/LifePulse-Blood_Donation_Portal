import express from 'express';
import {
  handleDonorResponse,
  getResponseDetails
} from '../controllers/responseController.js';

const router = express.Router();

router.post('/respond', handleDonorResponse);
router.get('/details', getResponseDetails);

export default router;
