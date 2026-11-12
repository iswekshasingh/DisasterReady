using System;
using System.Collections.Generic;
using UnityEngine;
using DisasterSurvival.Core;
using DisasterSurvival.UI;

namespace DisasterSurvival.Scenario
{
    /// <summary>
    /// Central registry containing ordered disaster simulation definitions: [Earthquake, Fire].
    /// Provides lookups by index or keyword, supporting seamless progression and modular additions.
    /// </summary>
    public static class SimulationRegistry
    {
        private static readonly List<SimulationDefinition> _simulations = new List<SimulationDefinition>();

        static SimulationRegistry()
        {
            RegisterSimulations();
        }

        private static void RegisterSimulations()
        {
            _simulations.Clear();
            _simulations.Add(CreateEarthquakeDefinition());
            _simulations.Add(CreateFireDefinition());
            _simulations.Add(CreateFloodDefinition());
        }

        public static int Count => _simulations.Count;

        public static IReadOnlyList<SimulationDefinition> All
        {
            get
            {
                if (_simulations.Count == 0) RegisterSimulations();
                return _simulations;
            }
        }

        public static SimulationDefinition GetSimulation(int index)
        {
            if (_simulations.Count == 0) RegisterSimulations();
            if (index >= 0 && index < _simulations.Count)
            {
                return _simulations[index];
            }
            return _simulations[0];
        }

        public static SimulationDefinition GetSimulationByKey(string key)
        {
            if (_simulations.Count == 0) RegisterSimulations();
            if (string.IsNullOrEmpty(key)) return _simulations[0];

            string lowerKey = key.ToLowerInvariant();
            for (int i = 0; i < _simulations.Count; i++)
            {
                if (_simulations[i].SimulationKey.ToLowerInvariant().Contains(lowerKey) ||
                    lowerKey.Contains(_simulations[i].SimulationKey.ToLowerInvariant()))
                {
                    return _simulations[i];
                }
            }
            return _simulations[0];
        }

        public static int IndexOf(string key)
        {
            if (_simulations.Count == 0) RegisterSimulations();
            if (string.IsNullOrEmpty(key)) return 0;

            string lowerKey = key.ToLowerInvariant();
            for (int i = 0; i < _simulations.Count; i++)
            {
                if (_simulations[i].SimulationKey.ToLowerInvariant().Contains(lowerKey) ||
                    lowerKey.Contains(_simulations[i].SimulationKey.ToLowerInvariant()))
                {
                    return i;
                }
            }
            return 0;
        }

        public static bool HasNext(int currentIndex)
        {
            return currentIndex + 1 < Count;
        }

        public static int GetNextIndex(int currentIndex)
        {
            return (currentIndex + 1) % Count;
        }

        private static SimulationDefinition CreateEarthquakeDefinition()
        {
            SimulationDefinition def = new SimulationDefinition
            {
                SimulationKey = "earthquake",
                DisplayTitle = "Earthquake Preparedness & Response",
                BadgeText = "SIMULATION 1",
                Description = "Drop, cover, and hold on! Survive indoor shaking, withstand falling debris, and evacuate safely.",
                AccentColor = new Color(0.92f, 0.65f, 0.15f, 1f),
                IntroText = GameLayoutManager.TextAlertGovernment,
                EducationalSummaryAllSafe = GameLayoutManager.TextSummaryAllSafe,
                EducationalSummaryPartial = GameLayoutManager.TextSummaryPartial,
                EducationalSummaryHazard = GameLayoutManager.TextSummaryHazard,
                KeyPrinciplesText =
                    "• DROP down onto your hands and knees immediately.\n" +
                    "• COVER your head and neck under a sturdy table.\n" +
                    "• HOLD ON until the shaking stops.\n" +
                    "• Use stairs to evacuate; never use elevators.",
                ResultCheckpointLabels = new List<string> { "DROPPED AND TOOK COVER", "STAYED UNDER COVER", "USED THE STAIRS" },
                ResultLearningLabels = new List<string> { "Drop, cover, and hold on", "Stay under sturdy shelter", "Never use elevators after shaking" },
                EnvironmentFactory = () =>
                {
                    GameObject host = new GameObject("EarthquakeEnvironment_Host");
                    return host.AddComponent<EarthquakeEnvironment>();
                }
            };

            // Beat 1: Warning
            def.Questions.Add(new QuestionData(
                GameLayoutManager.EQ_Q1_Id,
                GameLayoutManager.EQ_Q1_Prompt,
                new List<DecisionOption>
                {
                    new DecisionOption(GameLayoutManager.EQ_Q1_OptionA_Id, GameLayoutManager.EQ_Q1_OptionA_Label),
                    new DecisionOption(GameLayoutManager.EQ_Q1_OptionB_Id, GameLayoutManager.EQ_Q1_OptionB_Label)
                }
            ));

            // Beat 2: Shaking
            def.Questions.Add(new QuestionData(
                GameLayoutManager.EQ_Q2_Id,
                GameLayoutManager.EQ_Q2_Prompt,
                new List<DecisionOption>
                {
                    new DecisionOption(GameLayoutManager.EQ_Q2_OptionA_Id, GameLayoutManager.EQ_Q2_OptionA_Label),
                    new DecisionOption(GameLayoutManager.EQ_Q2_OptionB_Id, GameLayoutManager.EQ_Q2_OptionB_Label)
                }
            ));

            // Beat 3: Evacuation
            def.Questions.Add(new QuestionData(
                GameLayoutManager.EQ_Q3_Id,
                GameLayoutManager.EQ_Q3_Prompt,
                new List<DecisionOption>
                {
                    new DecisionOption(GameLayoutManager.EQ_Q3_OptionA_Id, GameLayoutManager.EQ_Q3_OptionA_Label),
                    new DecisionOption(GameLayoutManager.EQ_Q3_OptionB_Id, GameLayoutManager.EQ_Q3_OptionB_Label)
                }
            ));

            // Outcomes
            def.OutcomeMap[$"{GameLayoutManager.EQ_Q1_Id}_{GameLayoutManager.EQ_Q1_OptionA_Id}"] =
                new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.EQ_Q1_Safe_Message);
            def.OutcomeMap[$"{GameLayoutManager.EQ_Q1_Id}_{GameLayoutManager.EQ_Q1_OptionB_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.EQ_Q1_Harm_Message);

            def.OutcomeMap[$"{GameLayoutManager.EQ_Q2_Id}_{GameLayoutManager.EQ_Q2_OptionA_Id}"] =
                new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.EQ_Q2_Safe_Message);
            def.OutcomeMap[$"{GameLayoutManager.EQ_Q2_Id}_{GameLayoutManager.EQ_Q2_OptionB_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.EQ_Q2_Harm_Message);

            def.OutcomeMap[$"{GameLayoutManager.EQ_Q3_Id}_{GameLayoutManager.EQ_Q3_OptionA_Id}"] =
                new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.EQ_Q3_Safe_Message);
            def.OutcomeMap[$"{GameLayoutManager.EQ_Q3_Id}_{GameLayoutManager.EQ_Q3_OptionB_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.EQ_Q3_Harm_Message);

            return def;
        }

        private static SimulationDefinition CreateFireDefinition()
        {
            SimulationDefinition def = new SimulationDefinition
            {
                SimulationKey = "fire",
                DisplayTitle = "Building Fire & Smoke Evacuation",
                BadgeText = "SIMULATION 2",
                Description = "Emergency fire alarm! Check hot doors, stay low beneath toxic smoke, and find the refuge area.",
                AccentColor = new Color(0.92f, 0.32f, 0.18f, 1f),
                IntroText = GameLayoutManager.TextAlertFire,
                EducationalSummaryAllSafe = GameLayoutManager.FireSummaryAllSafe,
                EducationalSummaryPartial = GameLayoutManager.FireSummaryPartial,
                EducationalSummaryHazard = GameLayoutManager.FireSummaryHazard,
                KeyPrinciplesText = GameLayoutManager.FireKeyPrinciples,
                ResultCheckpointLabels = new List<string> { "CHECKED THE DOOR", "STAYED LOW UNDER SMOKE", "WAITED AT THE REFUGE" },
                ResultLearningLabels = new List<string> { "Check doors for heat", "Crawl below smoke", "Wait for rescue at a safe refuge" },
                EnvironmentFactory = () =>
                {
                    GameObject host = new GameObject("FireEnvironment_Host");
                    return host.AddComponent<FireEnvironment>();
                }
            };

            // Beat 1: The Door
            def.Questions.Add(new QuestionData(
                GameLayoutManager.FR_Q1_Id,
                GameLayoutManager.FR_Q1_Prompt,
                new List<DecisionOption>
                {
                    new DecisionOption(GameLayoutManager.FR_Q1_OptionA_Id, GameLayoutManager.FR_Q1_OptionA_Label),
                    new DecisionOption(GameLayoutManager.FR_Q1_OptionB_Id, GameLayoutManager.FR_Q1_OptionB_Label)
                }
            ));

            // Beat 2: The Smoke
            def.Questions.Add(new QuestionData(
                GameLayoutManager.FR_Q2_Id,
                GameLayoutManager.FR_Q2_Prompt,
                new List<DecisionOption>
                {
                    new DecisionOption(GameLayoutManager.FR_Q2_OptionA_Id, GameLayoutManager.FR_Q2_OptionA_Label),
                    new DecisionOption(GameLayoutManager.FR_Q2_OptionB_Id, GameLayoutManager.FR_Q2_OptionB_Label)
                }
            ));

            // Beat 3: The Exit (3 options)
            def.Questions.Add(new QuestionData(
                GameLayoutManager.FR_Q3_Id,
                GameLayoutManager.FR_Q3_Prompt,
                new List<DecisionOption>
                {
                    new DecisionOption(GameLayoutManager.FR_Q3_OptionA_Id, GameLayoutManager.FR_Q3_OptionA_Label),
                    new DecisionOption(GameLayoutManager.FR_Q3_OptionB_Id, GameLayoutManager.FR_Q3_OptionB_Label),
                    new DecisionOption(GameLayoutManager.FR_Q3_OptionC_Id, GameLayoutManager.FR_Q3_OptionC_Label)
                }
            ));

            // Outcomes
            def.OutcomeMap[$"{GameLayoutManager.FR_Q1_Id}_{GameLayoutManager.FR_Q1_OptionA_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.FR_Q1_Harm_Message);
            def.OutcomeMap[$"{GameLayoutManager.FR_Q1_Id}_{GameLayoutManager.FR_Q1_OptionB_Id}"] =
                new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.FR_Q1_Safe_Message);

            def.OutcomeMap[$"{GameLayoutManager.FR_Q2_Id}_{GameLayoutManager.FR_Q2_OptionA_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.FR_Q2_Harm_Message);
            def.OutcomeMap[$"{GameLayoutManager.FR_Q2_Id}_{GameLayoutManager.FR_Q2_OptionB_Id}"] =
                new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.FR_Q2_Safe_Message);

            def.OutcomeMap[$"{GameLayoutManager.FR_Q3_Id}_{GameLayoutManager.FR_Q3_OptionA_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.FR_Q3_Harm_Elevator_Message);
            def.OutcomeMap[$"{GameLayoutManager.FR_Q3_Id}_{GameLayoutManager.FR_Q3_OptionB_Id}"] =
                new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.FR_Q3_Safe_Refuge_Message);
            def.OutcomeMap[$"{GameLayoutManager.FR_Q3_Id}_{GameLayoutManager.FR_Q3_OptionC_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.FR_Q3_Harm_Belongings_Message);

            return def;
        }

        private static SimulationDefinition CreateFloodDefinition()
        {
            SimulationDefinition d = new SimulationDefinition {
                SimulationKey = "flood", DisplayTitle = "Flash Flood Safety", BadgeText = "SIMULATION 3",
                Description = "Move to high ground, stay away from electricity and floodwater, and wait for rescue.",
                AccentColor = new Color(.15f, .62f, .9f), IntroText = GameLayoutManager.FloodIntro,
                EducationalSummaryAllSafe = GameLayoutManager.FloodSummaryAllSafe,
                EducationalSummaryPartial = GameLayoutManager.FloodSummaryPartial,
                EducationalSummaryHazard = GameLayoutManager.FloodSummaryHazard,
                KeyPrinciplesText = GameLayoutManager.FloodKeyPrinciples,
                ResultCheckpointLabels = new List<string> { "MOVED UPSTAIRS EARLY", "AVOIDED WATER AND POWER", "CALLED FOR HELP" },
                ResultLearningLabels = new List<string> { "Go up at first warning", "Avoid water and electricity", "Call 112 and wait for rescue" },
                EnvironmentFactory = () => new GameObject("FloodEnvironment_Host").AddComponent<FloodEnvironment>()
            };
            AddFloodQuestion(d, GameLayoutManager.FloodQ1, GameLayoutManager.FloodQ1Prompt, GameLayoutManager.FloodQ1A, GameLayoutManager.FloodQ1B);
            AddFloodQuestion(d, GameLayoutManager.FloodQ2, GameLayoutManager.FloodQ2Prompt, GameLayoutManager.FloodQ2A, GameLayoutManager.FloodQ2B);
            d.Questions.Add(new QuestionData(GameLayoutManager.FloodQ3, GameLayoutManager.FloodQ3Prompt, new List<DecisionOption> {
                new DecisionOption("A", GameLayoutManager.FloodQ3A), new DecisionOption("B", GameLayoutManager.FloodQ3B), new DecisionOption("C", GameLayoutManager.FloodQ3C)}));
            d.OutcomeMap[$"{GameLayoutManager.FloodQ1}_A"] = new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.FloodQ1Safe);
            d.OutcomeMap[$"{GameLayoutManager.FloodQ1}_B"] = new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.FloodQ1Harm);
            d.OutcomeMap[$"{GameLayoutManager.FloodQ2}_A"] = new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.FloodQ2Harm);
            d.OutcomeMap[$"{GameLayoutManager.FloodQ2}_B"] = new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.FloodQ2Safe);
            d.OutcomeMap[$"{GameLayoutManager.FloodQ3}_A"] = new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.FloodQ3Drive);
            d.OutcomeMap[$"{GameLayoutManager.FloodQ3}_B"] = new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.FloodQ3Walk);
            d.OutcomeMap[$"{GameLayoutManager.FloodQ3}_C"] = new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.FloodQ3Safe);
            return d;
        }

        private static void AddFloodQuestion(SimulationDefinition d, string id, string prompt, string a, string b)
        {
            d.Questions.Add(new QuestionData(id, prompt, new List<DecisionOption> { new DecisionOption("A", a), new DecisionOption("B", b) }));
        }
    }
}

