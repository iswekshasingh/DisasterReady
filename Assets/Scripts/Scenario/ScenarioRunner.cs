
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DisasterSurvival.Core;
using DisasterSurvival.Character;
using DisasterSurvival.UI;
using DisasterSurvival.Audio;
using DisasterSurvival.Backend;

namespace DisasterSurvival.Scenario
{
    public class ScenarioRunner : MonoBehaviour
    {
        private const string PrefsHighestUnlockedKey =
            "DISASTER_HIGHEST_UNLOCKED_SIM";

        private const string EarthquakeBackendId =
            "60717a20-e54e-4b95-9253-c9b132a1374e";

        private int _currentSimIndex = 0;
        private SimulationDefinition _currentDefinition;
        private ISimulationEnvironment _currentEnvironment;

        private readonly List<AnswerSubmission> _recordedAnswers =
            new List<AnswerSubmission>();

        private int _safeDecisionsCount = 0;
        private float _simulationStartTime = 0f;

        private string _activeScenarioBackendId = "";
        private bool _isOfflineFallbackMode = false;

        public int CurrentSimulationIndex => _currentSimIndex;
        public SimulationDefinition CurrentDefinition => _currentDefinition;

        private void Awake()
        {
            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            if (_currentEnvironment != null)
            {
                _currentEnvironment.Teardown();

                if (_currentEnvironment is MonoBehaviour mb && mb != null)
                {
                    Destroy(mb.gameObject);
                }

                _currentEnvironment = null;
            }

            GameLayoutManager.Unregister<ScenarioRunner>();
        }

        // --------------------------------------------------
        // SIMULATION START
        // --------------------------------------------------

        public void StartOfflineSimulation(int index = -1)
        {
            if (index >= 0)
                _currentSimIndex = index;

            _isOfflineFallbackMode = false;
            StartSimulationByIndex(_currentSimIndex);
        }

        public void StartSimulationByIndex(int index)
        {
            StopAllCoroutines();

            _currentSimIndex = index;
            _currentDefinition =
                SimulationRegistry.GetSimulation(_currentSimIndex);

            if (_currentDefinition == null)
            {
                Debug.LogError(
                    $"[ScenarioRunner] Simulation not found: {index}");
                return;
            }

            _activeScenarioBackendId =
                _currentSimIndex == 0 ? EarthquakeBackendId : "";

            if (string.IsNullOrEmpty(_activeScenarioBackendId))
            {
                _isOfflineFallbackMode = true;
            }

            int highest = PlayerPrefs.GetInt(
                PrefsHighestUnlockedKey, 0);

            if (_currentSimIndex > highest)
            {
                PlayerPrefs.SetInt(PrefsHighestUnlockedKey, _currentSimIndex);
                PlayerPrefs.Save();
            }

            Debug.Log(
                $"[ScenarioRunner] Starting local simulation: " +
                $"{_currentDefinition.DisplayTitle}");

            StartCoroutine(RunSimulationFlow());
        }

        public void StartNextSimulation()
        {
            int nextIndex =
                SimulationRegistry.GetNextIndex(_currentSimIndex);

            Debug.Log(
                $"[ScenarioRunner] Advancing to simulation {nextIndex + 1}");

            if (GameLayoutManager.useBackend && nextIndex > 0)
            {
                _isOfflineFallbackMode = true;

                Debug.Log(
                    "[ScenarioRunner] Next simulation is running offline.");
            }
            else
            {
                _isOfflineFallbackMode = false;
            }

            StartSimulationByIndex(nextIndex);
        }

        // --------------------------------------------------
        // BACKEND SCENARIO START
        // --------------------------------------------------

        public void StartBackendSimulation(ScenarioDetail detail)
        {
            if (detail == null)
            {
                Debug.LogError(
                    "[ScenarioRunner] Backend scenario detail is null.");
                return;
            }

            string backendId = detail.GetId();

            if (string.IsNullOrWhiteSpace(backendId))
            {
                Debug.LogError(
                    "[ScenarioRunner] Backend scenario ID is missing.");
                return;
            }

            StopAllCoroutines();

            _isOfflineFallbackMode = false;
            _activeScenarioBackendId = backendId;

            Debug.Log(
                $"[ScenarioRunner] Backend Scenario ID: {backendId}");

            string searchTitle =
                (detail.title ?? "") + " " + backendId;

            _currentSimIndex =
                SimulationRegistry.IndexOf(searchTitle);

            _currentDefinition =
                SimulationRegistry.GetSimulation(_currentSimIndex);

            if (_currentDefinition == null)
            {
                Debug.LogError(
                    "[ScenarioRunner] No matching local simulation found.");
                return;
            }

            // IMPORTANT:
            // Keep local Questions and Options unchanged.
            // EarthquakeEnvironment uses their IDs to trigger animations.
            // Backend data is used for authentication, scenario identity,
            // and attempt submission.

            Debug.Log(
                $"[ScenarioRunner] Using local gameplay definition: " +
                $"{_currentDefinition.DisplayTitle}");

            StartCoroutine(RunSimulationFlow());
        }

        // --------------------------------------------------
        // MAIN SIMULATION FLOW
        // --------------------------------------------------

        private IEnumerator RunSimulationFlow()
        {
            _recordedAnswers.Clear();
            _safeDecisionsCount = 0;
            _simulationStartTime = Time.time;

            // Teardown previous environment
            if (_currentEnvironment != null)
            {
                _currentEnvironment.Teardown();

                if (_currentEnvironment is MonoBehaviour mb && mb != null)
                {
                    Destroy(mb.gameObject);
                }

                _currentEnvironment = null;
            }

            // Build environment
            Transform worldRoot =
                GameObject.Find("[World]")?.transform;

            _currentEnvironment =
                _currentDefinition.CreateEnvironment();

            if (_currentEnvironment != null)
            {
                _currentEnvironment.Build(worldRoot);
            }

            // Update simulation indicator
            SimulationIndicatorUI indicator =
                GameLayoutManager.Get<SimulationIndicatorUI>();

            if (indicator != null)
            {
                indicator.SetSimulation(
                    _currentSimIndex + 1,
                    SimulationRegistry.Count,
                    _currentDefinition.DisplayTitle,
                    _isOfflineFallbackMode);
            }

            DecisionUI decision =
                GameLayoutManager.Get<DecisionUI>();

            BannerUI banner =
                GameLayoutManager.Get<BannerUI>();

            if (decision == null)
            {
                Debug.LogError(
                    "[ScenarioRunner] DecisionUI not found.");
                yield break;
            }

            int questionCount =
                _currentDefinition.Questions.Count;

            for (int i = 0; i < questionCount; i++)
            {
                QuestionData question =
                    _currentDefinition.Questions[i];

                if (_currentEnvironment != null)
                {
                    yield return StartCoroutine(
                        _currentEnvironment.PlayBeatIntro(i, question));
                }

                string chosenOption = null;

                Debug.Log(
                    $"[ScenarioRunner] Showing question: {question.Id}");

                decision.ShowOptions(
                    question.Options,
                    optionId => chosenOption = optionId);

                while (chosenOption == null)
                {
                    yield return null;
                }

                Debug.Log(
                    $"[ScenarioRunner] Selected option: " +
                    $"Question={question.Id}, Option={chosenOption}");

                RecordAnswer(question.Id, chosenOption);

                OutcomeInfo outcome =
                    _currentDefinition.GetOutcome(
                        question.Id, chosenOption);

                if (_currentEnvironment != null)
                {
                    yield return StartCoroutine(
                        _currentEnvironment.PlayOutcome(
                            question.Id,
                            chosenOption,
                            outcome.Outcome));
                }
            }

            if (banner != null)
                banner.Clear();

            int totalElapsedSeconds = Mathf.Max(
                1,
                Mathf.RoundToInt(Time.time - _simulationStartTime));

            if (GameLayoutManager.useBackend &&
                !_isOfflineFallbackMode)
            {
                SubmitToBackend(totalElapsedSeconds);
            }
            else
            {
                ShowOfflineResults();
            }
        }

        // --------------------------------------------------
        // ANSWER RECORDING
        // --------------------------------------------------

        private void RecordAnswer(
            string questionId,
            string optionId)
        {
            _recordedAnswers.Add(
                new AnswerSubmission(questionId, optionId));

            OutcomeInfo outcome =
                _currentDefinition.GetOutcome(questionId, optionId);

            if (outcome != null &&
                outcome.Outcome == OutcomeType.Safe)
            {
                _safeDecisionsCount++;
            }
        }

        // --------------------------------------------------
        // OFFLINE RESULTS
        // --------------------------------------------------

        private void ShowOfflineResults()
        {
            ResultUI resultUI =
                GameLayoutManager.Get<ResultUI>();

            if (resultUI != null)
            {
                resultUI.ShowOfflineResults(
                    _safeDecisionsCount,
                    _currentDefinition.Questions.Count,
                    _currentSimIndex,
                    _currentDefinition,
                    onReplay: () =>
                        StartSimulationByIndex(_currentSimIndex),
                    onNextSim: () =>
                        StartNextSimulation());
            }
        }

        // --------------------------------------------------
        // BACKEND ATTEMPT SUBMISSION
        // --------------------------------------------------

        private void SubmitToBackend(int timeSpentSeconds)
        {
            if (string.IsNullOrEmpty(_activeScenarioBackendId))
            {
                Debug.LogWarning(
                    $"[ScenarioRunner] Simulation '{_currentDefinition?.DisplayTitle}' has no backend scenario ID. Showing offline results.");
                ShowOfflineResults();
                return;
            }

            LoadingSpinnerUI spinner =
                GameLayoutManager.Get<LoadingSpinnerUI>();

            if (spinner != null)
                spinner.Show(GameLayoutManager.TextAnalyzingDecisions);

            AttemptSubmissionRequest payload =
                new AttemptSubmissionRequest
                {
                    scenarioId = _activeScenarioBackendId,
                    answers = new List<AnswerSubmission>(
                        _recordedAnswers),
                    timeSpent = timeSpentSeconds
                };

            Debug.Log(
                $"[ScenarioRunner] Submitting scenario ID: " +
                $"{payload.scenarioId}");

            ApiClient api =
                GameLayoutManager.Get<ApiClient>();

            if (api == null)
            {
                if (spinner != null)
                    spinner.Hide();

                Debug.LogError(
                    "[ScenarioRunner] ApiClient not found.");

                ShowOfflineResults();
                return;
            }

            api.SubmitAttempt(
                payload,

                response =>
                {
                    if (spinner != null)
                        spinner.Hide();

                    ResultUI resultUI =
                        GameLayoutManager.Get<ResultUI>();

                    if (resultUI != null)
                    {
                        resultUI.ShowBackendResults(
                            response,
                            _currentSimIndex,
                            _currentDefinition,
                            onPlayAgain: () =>
                                StartSimulationByIndex(_currentSimIndex),
                            onNextSim: () =>
                                StartNextSimulation(),
                            onOpenLeaderboard: () =>
                                FetchAndShowLeaderboard());
                    }
                },

                error =>
                {
                    if (spinner != null)
                        spinner.Hide();

                    Debug.LogError(
                        $"[ScenarioRunner] Attempt submission failed: {error}");

                    ResultUI resultUI =
                        GameLayoutManager.Get<ResultUI>();

                    if (resultUI != null)
                    {
                        resultUI.ShowNetworkFailure(
                            error,
                            () => SubmitToBackend(timeSpentSeconds));
                    }
                });
        }

        // --------------------------------------------------
        // LEADERBOARD
        // --------------------------------------------------

        private void FetchAndShowLeaderboard()
        {
            LoadingSpinnerUI spinner =
                GameLayoutManager.Get<LoadingSpinnerUI>();

            if (spinner != null)
                spinner.Show("Fetching Leaderboard...");

            ApiClient api =
                GameLayoutManager.Get<ApiClient>();

            if (api == null)
            {
                if (spinner != null)
                    spinner.Hide();

                Debug.LogError(
                    "[ScenarioRunner] ApiClient not found.");

                return;
            }

            api.GetLeaderboard(
                entries =>
                {
                    if (spinner != null)
                        spinner.Hide();

                    ResultUI resultUI =
                        GameLayoutManager.Get<ResultUI>();

                    if (resultUI != null)
                        resultUI.DisplayLeaderboard(entries);
                },

                error =>
                {
                    if (spinner != null)
                        spinner.Hide();

                    Debug.LogError(
                        $"[ScenarioRunner] Failed to fetch leaderboard: {error}");
                });
        }
    }
}
