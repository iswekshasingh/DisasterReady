using System.Collections;
using UnityEngine;

namespace DisasterSurvival.Scenario
{
    /// <summary>
    /// Interface for simulation-specific environments.
    /// Manages spawning world objects, driving beat intros, playing outcome animations, and tearing down.
    /// </summary>
    public interface ISimulationEnvironment
    {
        /// <summary>
        /// Instantiates or configures the visual props, background, and hazards for this simulation.
        /// </summary>
        void Build(Transform worldRoot);

        /// <summary>
        /// Coroutine that executes any intro animation, alerts, or sound effects before the beat question is presented.
        /// </summary>
        IEnumerator PlayBeatIntro(int beatIndex, QuestionData question);

        /// <summary>
        /// Coroutine that executes the visual and audio outcome animation for the chosen option.
        /// </summary>
        IEnumerator PlayOutcome(string questionId, string optionId, OutcomeType outcomeType);

        /// <summary>
        /// Cleans up and destroys all environment-specific GameObjects when switching to another simulation.
        /// </summary>
        void Teardown();
    }
}

