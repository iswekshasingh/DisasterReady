using System;
using System.Collections.Generic;
using DisasterSurvival.Core;
using DisasterSurvival.UI;

namespace DisasterSurvival.Scenario
{
    public enum OutcomeType
    {
        Safe,
        Harm,
        Neutral
    }

    [Serializable]
    public class OutcomeInfo
    {
        public OutcomeType Outcome;
        public string Message;

        public OutcomeInfo(OutcomeType outcome, string message)
        {
            Outcome = outcome;
            Message = message;
        }
    }

    [Serializable]
    public class QuestionData
    {
        public string Id;
        public string Prompt;
        public List<DecisionOption> Options = new List<DecisionOption>();

        public QuestionData(string id, string prompt, List<DecisionOption> options)
        {
            Id = id;
            Prompt = prompt;
            Options = options;
        }
    }

    /// <summary>
    /// Data-driven definition of a disaster simulation.
    /// Easily editable and extendable for new disasters (Tsunami, Fire, Tornado, etc.).
    /// </summary>
    public class ScenarioData
    {
        public string ScenarioId;
        public string ScenarioTitle;
        public List<QuestionData> Questions = new List<QuestionData>();

        // Central OutcomeMap: maps "{questionId}_{optionId}" to an outcome and educational rationale
        public Dictionary<string, OutcomeInfo> OutcomeMap = new Dictionary<string, OutcomeInfo>();

        public OutcomeInfo GetOutcome(string questionId, string optionId)
        {
            string key = $"{questionId}_{optionId}";
            if (OutcomeMap.TryGetValue(key, out OutcomeInfo info))
            {
                return info;
            }
            // Default fallback
            return new OutcomeInfo(OutcomeType.Neutral, "Decision recorded.");
        }

        /// <summary>
        /// Creates the complete Simulation 1 (Earthquake) dataset from GameLayoutManager constants.
        /// </summary>
        public static ScenarioData CreateDefaultEarthquakeScenario()
        {
            ScenarioData data = new ScenarioData
            {
                ScenarioId = "SIM_EARTHQUAKE_01",
                ScenarioTitle = "Earthquake Preparedness & Response"
            };

            // Beat 1: Pre-shaking warning
            data.Questions.Add(new QuestionData(
                GameLayoutManager.EQ_Q1_Id,
                GameLayoutManager.EQ_Q1_Prompt,
                new List<DecisionOption>
                {
                    new DecisionOption(GameLayoutManager.EQ_Q1_OptionA_Id, GameLayoutManager.EQ_Q1_OptionA_Label),
                    new DecisionOption(GameLayoutManager.EQ_Q1_OptionB_Id, GameLayoutManager.EQ_Q1_OptionB_Label)
                }
            ));

            // Beat 2: During shaking
            data.Questions.Add(new QuestionData(
                GameLayoutManager.EQ_Q2_Id,
                GameLayoutManager.EQ_Q2_Prompt,
                new List<DecisionOption>
                {
                    new DecisionOption(GameLayoutManager.EQ_Q2_OptionA_Id, GameLayoutManager.EQ_Q2_OptionA_Label),
                    new DecisionOption(GameLayoutManager.EQ_Q2_OptionB_Id, GameLayoutManager.EQ_Q2_OptionB_Label)
                }
            ));

            // Beat 3: Post-shaking evacuation
            data.Questions.Add(new QuestionData(
                GameLayoutManager.EQ_Q3_Id,
                GameLayoutManager.EQ_Q3_Prompt,
                new List<DecisionOption>
                {
                    new DecisionOption(GameLayoutManager.EQ_Q3_OptionA_Id, GameLayoutManager.EQ_Q3_OptionA_Label),
                    new DecisionOption(GameLayoutManager.EQ_Q3_OptionB_Id, GameLayoutManager.EQ_Q3_OptionB_Label)
                }
            ));

            // Central OutcomeMap
            data.OutcomeMap[$"{GameLayoutManager.EQ_Q1_Id}_{GameLayoutManager.EQ_Q1_OptionA_Id}"] =
                new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.EQ_Q1_Safe_Message);
            data.OutcomeMap[$"{GameLayoutManager.EQ_Q1_Id}_{GameLayoutManager.EQ_Q1_OptionB_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.EQ_Q1_Harm_Message);

            data.OutcomeMap[$"{GameLayoutManager.EQ_Q2_Id}_{GameLayoutManager.EQ_Q2_OptionA_Id}"] =
                new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.EQ_Q2_Safe_Message);
            data.OutcomeMap[$"{GameLayoutManager.EQ_Q2_Id}_{GameLayoutManager.EQ_Q2_OptionB_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.EQ_Q2_Harm_Message);

            data.OutcomeMap[$"{GameLayoutManager.EQ_Q3_Id}_{GameLayoutManager.EQ_Q3_OptionA_Id}"] =
                new OutcomeInfo(OutcomeType.Safe, GameLayoutManager.EQ_Q3_Safe_Message);
            data.OutcomeMap[$"{GameLayoutManager.EQ_Q3_Id}_{GameLayoutManager.EQ_Q3_OptionB_Id}"] =
                new OutcomeInfo(OutcomeType.Harm, GameLayoutManager.EQ_Q3_Harm_Message);

            return data;
        }
    }
}

