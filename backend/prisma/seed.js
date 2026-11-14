
import { getPrismaClient } from '../src/config/db.js';

const prisma = getPrismaClient();

const scenarios = [
{
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
                question: 'An earthquake warning has sounded! What will you do?',
                options: [
                    { optionId: 'A', text: 'Hide under a sturdy table' },
                    { optionId: 'B', text: 'Run outside the building' }
                ],
                correctOptionId: 'A',
                points: 34,
                explanation:
                    'Drop, Cover and Hold On. Protect your head and neck under sturdy furniture until the shaking stops.'
            },
            {
                questionId: 'EQ_Q2',
                question: 'Violent ground shaking begins! Heavy ceiling tiles start cracking above!',
                options: [
                    { optionId: 'A', text: 'Stay under cover until the shaking stops' },
                    { optionId: 'B', text: 'Crawl out and run for the door' }
                ],
                correctOptionId: 'A',
                points: 33,
                explanation:
                    'Remain under sturdy cover while shaking continues. Stay away from windows and falling objects.'
            },
            {
                questionId: 'EQ_Q3',
                question: 'The shaking has subsided, but aftershocks may follow. How will you evacuate?',
                options: [
                    { optionId: 'A', text: 'Leave carefully using the stairs' },
                    { optionId: 'B', text: 'Take the elevator down' }
                ],
                correctOptionId: 'A',
                points: 33,
                explanation:
                    'Check for injuries and hazards. If evacuation is necessary, use stairs rather than elevators and follow official instructions.'
            }
        ]
    }
},
{
    title: 'Fire Evacuation Training',
    description: 'Practice checking doors, staying below smoke, and waiting at a safe refuge.',
    disasterType: 'FIRE',
    difficulty: 'EASY',
    estimatedDuration: 5,
    passingScore: 70,
    maxScore: 100,
    isPublished: true,
    scenarioData: {
        instructions: 'Read each situation carefully and select the safest response.',
        questions: [
            { questionId: 'FR_Q1', question: 'The fire alarm sounds and smoke seeps under the door! What will you do?', options: [{ optionId: 'A', text: 'Open the door and run out' }, { optionId: 'B', text: 'Check the door with the back of your hand first' }], correctOptionId: 'B', points: 34, explanation: 'Check a door for heat before opening it; a hot door means fire may be on the other side.' },
            { questionId: 'FR_Q2', question: 'The corridor is filling with smoke that sinks lower every second! How do you move?', options: [{ optionId: 'A', text: 'Stand up straight and run through quickly' }, { optionId: 'B', text: 'Stay low and crawl under the smoke' }], correctOptionId: 'B', points: 33, explanation: 'Stay low where the air is clearer and crawl beneath smoke.' },
            { questionId: 'FR_Q3', question: 'You have reached the fire refuge area on the balcony. What should you do next?', options: [{ optionId: 'A', text: 'Take the elevator' }, { optionId: 'B', text: 'Wait for rescue in the refuge area' }, { optionId: 'C', text: 'Go back for your phone and belongings' }], correctOptionId: 'B', points: 33, explanation: 'Wait for rescue in a safe refuge; never use elevators or return for belongings.' }
        ]
    }
},
{
    title: 'Flash Flood Safety Training',
    description: 'Practice moving to high ground, avoiding floodwater and electricity, and waiting for rescue.',
    disasterType: 'FLOOD',
    difficulty: 'EASY',
    estimatedDuration: 5,
    passingScore: 70,
    maxScore: 100,
    isPublished: true,
    scenarioData: {
        instructions: 'Read each situation carefully and select the safest response.',
        questions: [
            { questionId: 'FL_Q1', question: 'Flash flood warning: water levels are rising rapidly. What will you do?', options: [{ optionId: 'A', text: 'Move upstairs to higher ground now' }, { optionId: 'B', text: 'Stay on the ground floor and wait and see' }], correctOptionId: 'A', points: 34, explanation: 'Move to higher ground as soon as a flood warning is issued.' },
            { questionId: 'FL_Q2', question: 'Water has reached the sockets and an appliance is plugged in downstairs. What will you do?', options: [{ optionId: 'A', text: 'Wade down and unplug it' }, { optionId: 'B', text: 'Stay out of the water and away from electrical items' }], correctOptionId: 'B', points: 33, explanation: 'Never enter floodwater near electrical equipment.' },
            { questionId: 'FL_Q3', question: 'The street is a fast river. What will you do?', options: [{ optionId: 'A', text: 'Drive through the flooded road' }, { optionId: 'B', text: 'Wade through the water' }, { optionId: 'C', text: 'Call emergency services and wait on the rooftop' }], correctOptionId: 'C', points: 33, explanation: 'Stay on high ground, call for help, and wait for rescue.' }
        ]
    }
}
];

async function main() {
    for (const scenario of scenarios) {
        const existingScenario = await prisma.scenario.findFirst({ where: { disasterType: scenario.disasterType } });
        if (existingScenario) {
            await prisma.scenario.update({ where: { id: existingScenario.id }, data: scenario });
        } else {
            await prisma.scenario.create({ data: scenario });
        }
        console.log(`${scenario.disasterType} scenario seeded successfully.`);
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
