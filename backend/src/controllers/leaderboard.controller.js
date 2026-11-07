
import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

// Get top 10 users by total points
export const getLeaderboard = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: [
                { totalPoints: 'desc' },
                { createdAt: 'asc' }
            ],
            take: 10,
            select: {
                id: true,
                username: true,
                fullName: true,
                totalPoints: true,
                level: true,
                badges: true
            }
        });

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            ...user
        }));

        return res.status(200).json({
            success: true,
            count: leaderboard.length,
            leaderboard
        });

    } catch (error) {
        console.error('Get leaderboard error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch leaderboard'
        });
    }
};
