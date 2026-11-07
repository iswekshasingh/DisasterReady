
import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

// Submit answers and evaluate an attempt
export const submitAttempt = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { scenarioId, answers, timeSpent } = req.body;

        // Validate request
        if (!scenarioId || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Scenario ID and answers are required'
            });
        }

        if (
            timeSpent !== undefined &&
            (!Number.isInteger(timeSpent) || timeSpent < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Time spent must be a non-negative integer'
            });
        }

        // Find the published scenario
        const scenario = await prisma.scenario.findFirst({
            where: {
                id: scenarioId,
                isPublished: true
            }
        });

        if (!scenario) {
            return res.status(404).json({
                success: false,
                message: 'Scenario not found'
            });
        }

        const questions = scenario.scenarioData.questions;

        // Ensure every question is answered exactly once
        const questionIds = questions.map(q => q.questionId);
        const submittedIds = answers.map(a => a.questionId);

        if (
            answers.length !== questions.length ||
            new Set(submittedIds).size !== submittedIds.length ||
            !submittedIds.every(id => questionIds.includes(id))
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please submit one answer for every question'
            });
        }

        // Evaluate answers on the backend
        let score = 0;
        let correctAnswers = 0;

        const results = questions.map(question => {
            const submittedAnswer = answers.find(
                answer => answer.questionId === question.questionId
            );

            const selectedOption = question.options.find(
                option => option.optionId === submittedAnswer.selectedOptionId
            );

            if (!selectedOption) {
                throw new Error('Invalid option submitted');
            }

            const isCorrect =
                submittedAnswer.selectedOptionId === question.correctOptionId;

            if (isCorrect) {
                score += question.points;
                correctAnswers++;
            }

            return {
                questionId: question.questionId,
                selectedOptionId: submittedAnswer.selectedOptionId,
                correctOptionId: question.correctOptionId,
                isCorrect,
                points: isCorrect ? question.points : 0,
                explanation: question.explanation
            };
        });

        // Save attempt and update user's total points
        const attempt = await prisma.$transaction(async (tx) => {
            const savedAttempt = await tx.attempt.create({
                data: {
                    userId,
                    scenarioId,
                    score,
                    status: 'COMPLETED',
                    userChoices: answers,
                    timeSpent: timeSpent ?? null,
                    completedAt: new Date()
                }
            });

            await tx.user.update({
                where: { id: userId },
                data: {
                    totalPoints: { increment: score }
                }
            });

            return savedAttempt;
        });

        return res.status(201).json({
            success: true,
            message: 'Attempt submitted successfully',
            attempt: {
                id: attempt.id,
                scenarioId,
                score,
                maxScore: scenario.maxScore,
                correctAnswers,
                totalQuestions: questions.length,
                passed: score >= scenario.passingScore,
                results
            }
        });

    } catch (error) {
        console.error('Submit attempt error:', error);

        if (error.message === 'Invalid option submitted') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to submit attempt'
        });
    }
};
