import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

// Get logged-in user's attempt history
export const getAttemptHistory = async (req, res) => {
    try {
        const userId = req.user.userId;

        const attempts = await prisma.attempt.findMany({
            where: {
                userId,
                status: 'COMPLETED'
            },
            include: {
                scenario: {
                    select: {
                        title: true,
                        disasterType: true,
                        difficulty: true
                    }
                }
            },
            orderBy: {
                completedAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            count: attempts.length,
            attempts
        });

    } catch (error) {
        console.error('Get attempt history error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch attempt history'
        });
    }
};