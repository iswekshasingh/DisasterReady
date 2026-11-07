
import { getPrismaClient } from '../src/config/db.js';

const prisma = getPrismaClient();

const earthquakeScenario = {
    title: 'Earthquake Safety Training',
    description:
        'Learn how to respond safely before, during, and immediately after an earthquake.',
    disasterType: 'EARTHQUAKE',
    difficulty: 'EASY',
    estimatedDuration: 5,
    passingScore: 70,
    maxScore: 100,
    isPublished: true,

    scenarioData: {
        instructions:
            'Read each situation carefully and select the safest response.',

        questions: [
            {
                questionId: 'EQ_Q1',
                question: 'An earthquake suddenly begins. What should you do?',
                options: [
                    { optionId: 'A', text: 'Run towards the exit immediately' },
                    { optionId: 'B', text: 'Drop, Cover and Hold On under sturdy furniture' },
                    { optionId: 'C', text: 'Stand near the window' }
                ],
                correctOptionId: 'B',
                points: 30,
                explanation:
                    'Drop, Cover and Hold On. Protect your head and neck under sturdy furniture until the shaking stops.'
            },
            {
                questionId: 'EQ_Q2',
                question: 'The shaking continues and objects are falling. What should you do?',
                options: [
                    { optionId: 'A', text: 'Run around the room' },
                    { optionId: 'B', text: 'Move towards the windows' },
                    { optionId: 'C', text: 'Stay under cover and protect your head and neck' }
                ],
                correctOptionId: 'C',
                points: 30,
                explanation:
                    'Remain under sturdy cover while shaking continues. Stay away from windows and falling objects.'
            },
            {
                questionId: 'EQ_Q3',
                question: 'The shaking has stopped. What should you do next?',
                options: [
                    { optionId: 'A', text: 'Use the elevator immediately' },
                    { optionId: 'B', text: 'Check for hazards and evacuate carefully using stairs if needed' },
                    { optionId: 'C', text: 'Return to collect your belongings' }
                ],
                correctOptionId: 'B',
                points: 40,
                explanation:
                    'Check for injuries and hazards. If evacuation is necessary, use stairs rather than elevators and follow official instructions.'
            }
        ]
    }
};

async function main() {
    const existingScenario = await prisma.scenario.findFirst({
        where: {
            title: earthquakeScenario.title,
            disasterType: earthquakeScenario.disasterType
        }
    });

    if (existingScenario) {
        await prisma.scenario.update({
            where: { id: existingScenario.id },
            data: earthquakeScenario
        });

        console.log('Earthquake scenario updated successfully!');
    } else {
        await prisma.scenario.create({
            data: earthquakeScenario
        });

        console.log('Earthquake scenario created successfully!');
    }
}

main()
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
