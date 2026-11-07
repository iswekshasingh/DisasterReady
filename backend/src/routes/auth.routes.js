import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authenticateToken, (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user
    });
});

export default router;