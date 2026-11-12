using System;
using System.Collections.Generic;
using UnityEngine;

namespace DisasterSurvival.Scenario
{
    /// <summary>
    /// Plain C# definition describing a complete disaster simulation,
    /// including its identity, questions, options, outcomes, educational recaps,
    /// and factory for its environment.
    /// </summary>
    public class SimulationDefinition
    {
        public string SimulationKey { get; set; }
        public string DisplayTitle { get; set; }
        public string IntroText { get; set; }
        public string Description { get; set; }
        public string BadgeText { get; set; }
        public Color AccentColor { get; set; } = new Color(0.2f, 0.6f, 0.9f, 1f);
        public List<QuestionData> Questions { get; set; } = new List<QuestionData>();
        public Dictionary<string, OutcomeInfo> OutcomeMap { get; set; } = new Dictionary<string, OutcomeInfo>();

        // Educational feedback specific to this simulation
        public string EducationalSummaryAllSafe { get; set; }
        public string EducationalSummaryPartial { get; set; }
        public string EducationalSummaryHazard { get; set; }
        public string KeyPrinciplesText { get; set; }
        public List<string> ResultCheckpointLabels { get; set; } = new List<string>();
        public List<string> ResultLearningLabels { get; set; } = new List<string>();

        // Environment factory
        public Func<ISimulationEnvironment> EnvironmentFactory { get; set; }

        public ISimulationEnvironment CreateEnvironment()
        {
            return EnvironmentFactory != null ? EnvironmentFactory() : null;
        }

        public OutcomeInfo GetOutcome(string questionId, string optionId)
        {
            string key = $"{questionId}_{optionId}";
            if (OutcomeMap.TryGetValue(key, out OutcomeInfo info))
            {
                return info;
            }
            return new OutcomeInfo(OutcomeType.Neutral, "Decision recorded.");
        }
    }
}

