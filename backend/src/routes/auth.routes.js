import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getPrismaClient } from '../config/db.js';

const router = express.Router();
const prisma = getPrismaClient();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                totalPoints: true,
                level: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User profile not found' });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load user profile' });
    }
});

export default router;
