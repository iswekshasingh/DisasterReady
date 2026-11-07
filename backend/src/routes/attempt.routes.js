import express from 'express';
import { submitAttempt } from '../controllers/attempt.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticateToken, submitAttempt);

export default router;
