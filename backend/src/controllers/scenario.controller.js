
import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

// Get all published scenarios
export const getScenarios = async (req, res) => {
    try {
        const scenarios = await prisma.scenario.findMany({
            where: { isPublished: true },
            select: {
                id: true,
                title: true,
                description: true,
                disasterType: true,
                difficulty: true,
                estimatedDuration: true,
                passingScore: true,
                maxScore: true
            }
        });

        return res.status(200).json({
            success: true,
            count: scenarios.length,
            scenarios
        });
    } catch (error) {
        console.error('Get scenarios error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch scenarios'
        });
    }
};

// Get one scenario by ID
export const getScenarioById = async (req, res) => {
    try {
        const { id } = req.params;

        const scenario = await prisma.scenario.findFirst({
            where: {
                id,
                isPublished: true
            }
        });

        if (!scenario) {
            return res.status(404).json({
                success: false,
                message: 'Scenario not found'
            });
        }

        const safeQuestions = scenario.scenarioData.questions.map(
            ({ questionId, question, options, points }) => ({
                questionId,
                question,
                options,
                points
            })
        );

        return res.status(200).json({
            success: true,
            scenario: {
                id: scenario.id,
                title: scenario.title,
                description: scenario.description,
                disasterType: scenario.disasterType,
                difficulty: scenario.difficulty,
                estimatedDuration: scenario.estimatedDuration,
                passingScore: scenario.passingScore,
                maxScore: scenario.maxScore,
                instructions: scenario.scenarioData.instructions,
                questions: safeQuestions
            }
        });
    } catch (error) {
        console.error('Get scenario error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch scenario'
        });
    }
};
