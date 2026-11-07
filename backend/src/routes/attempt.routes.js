import express from 'express';
import { submitAttempt } from '../controllers/attempt.controller.js';
import { getAttemptHistory } from '../controllers/attemptHistory.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticateToken, submitAttempt);
router.get('/', authenticateToken, getAttemptHistory);

export default router;