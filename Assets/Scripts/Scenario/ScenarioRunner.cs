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
    /// <summary>
    /// Generic, data-driven simulation runner that orchestrates any disaster scenario
    /// via the ISimulationEnvironment interface and SimulationRegistry.
    /// Manages beat transitions, decision prompts, answer tracking, duration measurement,
    /// backend submissions, and progression to subsequent simulations.
    /// </summary>
    public class ScenarioRunner : MonoBehaviour
    {
        private const string PrefsHighestUnlockedKey = "DISASTER_HIGHEST_UNLOCKED_SIM";

        private int _currentSimIndex = 0;
        private SimulationDefinition _currentDefinition;
        private ISimulationEnvironment _currentEnvironment;

        private readonly List<AnswerSubmission> _recordedAnswers = new List<AnswerSubmission>();
        private readonly List<bool> _decisionWasSafe = new List<bool>();
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
                _currentEnvironment = null;
            }
            GameLayoutManager.Unregister<ScenarioRunner>();
        }

        public void StartOfflineSimulation(int index = -1)
        {
            if (index >= 0)
            {
                _currentSimIndex = index;
            }
            _isOfflineFallbackMode = false;
            StartSimulationByIndex(_currentSimIndex);
        }

        public void StartSimulationByIndex(int index)
        {
            StopAllCoroutines();
            _currentSimIndex = index;
            _currentDefinition = SimulationRegistry.GetSimulation(_currentSimIndex);
            _activeScenarioBackendId = _currentDefinition.SimulationKey;

            // Track highest unlocked simulation progression in PlayerPrefs
            // TODO: Replace with backend user progress sync when user profile endpoint is connected
            int highest = PlayerPrefs.GetInt(PrefsHighestUnlockedKey, 0);
            if (_currentSimIndex > highest)
            {
                PlayerPrefs.SetInt(PrefsHighestUnlockedKey, _currentSimIndex);
                PlayerPrefs.Save();
            }

            StartCoroutine(RunSimulationFlow());
        }

        public void StartNextSimulation()
        {
            int nextIndex = SimulationRegistry.GetNextIndex(_currentSimIndex);
            Debug.Log($"[ScenarioRunner] Advancing from simulation {_currentSimIndex + 1} to {nextIndex + 1} ({SimulationRegistry.GetSimulation(nextIndex).DisplayTitle})...");

            // In backend mode, check if we need to fall back to offline if the backend lacks this simulation
            if (GameLayoutManager.useBackend && nextIndex > 0)
            {
                _isOfflineFallbackMode = true;
                Debug.Log("[ScenarioRunner] Backend currently only provides earthquake scenario. Running next simulation in Offline Test Mode (attempt submission disabled).");
            }
            else
            {
                _isOfflineFallbackMode = false;
            }

            StartSimulationByIndex(nextIndex);
        }

        public void StartBackendSimulation(ScenarioDetail detail)
        {
            StopAllCoroutines();
            _isOfflineFallbackMode = false;
            _activeScenarioBackendId = detail.GetId();

            // Match simulation environment by keyword in title/id ("earthquake", "fire")
            string searchTitle = (!string.IsNullOrEmpty(detail.title) ? detail.title : "") + " " + detail.GetId();
            _currentSimIndex = SimulationRegistry.IndexOf(searchTitle);
            _currentDefinition = SimulationRegistry.GetSimulation(_currentSimIndex);

            // If backend provided custom questions/labels, adapt them while preserving local outcome maps
            if (detail.questions != null && detail.questions.Count > 0)
            {
                _currentDefinition.Questions.Clear();
                foreach (QuestionItem qItem in detail.questions)
                {
                    List<DecisionOption> opts = new List<DecisionOption>();
                    if (qItem.options != null)
                    {
                        foreach (OptionItem oItem in qItem.options)
                        {
                            opts.Add(new DecisionOption(oItem.id, oItem.GetLabel()));
                        }
                    }
                    _currentDefinition.Questions.Add(new QuestionData(qItem.id, qItem.prompt, opts));
                }
            }

            StartCoroutine(RunSimulationFlow());
        }

        private IEnumerator RunSimulationFlow()
        {
            _recordedAnswers.Clear();
            _decisionWasSafe.Clear();
            _safeDecisionsCount = 0;
            _simulationStartTime = Time.time;

            // 1. Teardown previous simulation environment if active
            if (_currentEnvironment != null)
            {
                _currentEnvironment.Teardown();
                if (_currentEnvironment is MonoBehaviour mb && mb != null)
                {
                    Destroy(mb.gameObject);
                }
                _currentEnvironment = null;
            }

            // 2. Build new environment for current simulation
            Transform worldRoot = GameObject.Find("[World]")?.transform;
            // The starter screen intentionally hides the persistent character. Restore it
            // before any environment starts movement coroutines on the character object.
            CharacterController2D player = GameLayoutManager.Get<CharacterController2D>();
            if (player != null)
            {
                player.gameObject.SetActive(true);
                player.ResetToStart();
            }
            _currentEnvironment = _currentDefinition.CreateEnvironment();
            if (_currentEnvironment != null)
            {
                _currentEnvironment.Build(worldRoot);
            }

            // 3. Update simulation indicator header in UI
            SimulationIndicatorUI indicator = GameLayoutManager.Get<SimulationIndicatorUI>();
            if (indicator != null)
            {
                indicator.SetSimulation(_currentSimIndex + 1, SimulationRegistry.Count, _currentDefinition.DisplayTitle, _isOfflineFallbackMode);
            }

            DecisionUI decision = GameLayoutManager.Get<DecisionUI>();
            BannerUI banner = GameLayoutManager.Get<BannerUI>();

            // 4. Run through all beats
            int questionCount = _currentDefinition.Questions.Count;
            for (int i = 0; i < questionCount; i++)
            {
                QuestionData q = _currentDefinition.Questions[i];

                // Execute beat intro (alarms, visual cues, camera shake, typewriter alerts)
                if (_currentEnvironment != null)
                {
                    yield return StartCoroutine(_currentEnvironment.PlayBeatIntro(i, q));
                }

                // Show player choice options
                string chosenOption = null;
                if (decision != null)
                {
                    decision.gameObject.SetActive(true);
                    decision.ShowOptions(q.Options, opt => chosenOption = opt);
                }
                else
                {
                    Debug.LogError("[ScenarioRunner] DecisionUI is missing; cannot present simulation choices.");
                    yield break;
                }

                while (chosenOption == null)
                {
                    yield return null;
                }

                RecordAnswer(q.Id, chosenOption);

                // Execute outcome animation & feedback
                OutcomeInfo outcome = _currentDefinition.GetOutcome(q.Id, chosenOption);
                if (_currentEnvironment != null)
                {
                    yield return StartCoroutine(_currentEnvironment.PlayOutcome(q.Id, chosenOption, outcome.Outcome));
                }
            }

            if (banner != null) banner.Clear();

            // 5. Evaluate completion & display results
            int totalElapsedSeconds = Mathf.Max(1, Mathf.RoundToInt(Time.time - _simulationStartTime));

            if (GameLayoutManager.useBackend && !_isOfflineFallbackMode)
            {
                SubmitToBackend(totalElapsedSeconds);
            }
            else
            {
                ShowOfflineResults();
            }
        }

        private void RecordAnswer(string questionId, string optionId)
        {
            _recordedAnswers.Add(new AnswerSubmission(questionId, optionId));

            OutcomeInfo outcome = _currentDefinition.GetOutcome(questionId, optionId);
            bool safe = outcome != null && outcome.Outcome == OutcomeType.Safe;
            _decisionWasSafe.Add(safe);
            if (safe)
            {
                _safeDecisionsCount++;
            }
        }

        private void ShowOfflineResults()
        {
            ResultUI resultUI = GameLayoutManager.Get<ResultUI>();
            if (resultUI != null)
            {
                resultUI.ShowOfflineResults(
                    _safeDecisionsCount,
                    _currentDefinition.Questions.Count,
                    _currentSimIndex,
                    _currentDefinition,
                    onReplay: () => StartSimulationByIndex(_currentSimIndex),
                    onNextSim: () => StartNextSimulation(),
                    decisionWasSafe: _decisionWasSafe
                );
            }
        }

        private void SubmitToBackend(int timeSpentSeconds)
        {
            LoadingSpinnerUI spinner = GameLayoutManager.Get<LoadingSpinnerUI>();
            if (spinner != null) spinner.Show(GameLayoutManager.TextAnalyzingDecisions);

            AttemptSubmissionRequest payload = new AttemptSubmissionRequest
            {
                scenarioId = _activeScenarioBackendId,
                answers = new List<AnswerSubmission>(_recordedAnswers),
                timeSpent = timeSpentSeconds
            };

            ApiClient api = GameLayoutManager.Get<ApiClient>();
            if (api == null)
            {
                if (spinner != null) spinner.Hide();
                ShowOfflineResults();
                return;
            }

            api.SubmitAttempt(payload,
                response =>
                {
                    if (spinner != null) spinner.Hide();
                    ResultUI resultUI = GameLayoutManager.Get<ResultUI>();
                    if (resultUI != null)
                    {
                        resultUI.ShowBackendResults(
                            response,
                            _currentSimIndex,
                            _currentDefinition,
                            onPlayAgain: () => StartSimulationByIndex(_currentSimIndex),
                            onNextSim: () => StartNextSimulation(),
                            onOpenLeaderboard: () => FetchAndShowLeaderboard(),
                            decisionWasSafe: _decisionWasSafe
                        );
                    }
                },
                error =>
                {
                    if (spinner != null) spinner.Hide();
                    ResultUI resultUI = GameLayoutManager.Get<ResultUI>();
                    if (resultUI != null)
                    {
                        resultUI.ShowNetworkFailure(error, () => SubmitToBackend(timeSpentSeconds));
                    }
                }
            );
        }

        private void FetchAndShowLeaderboard()
        {
            LoadingSpinnerUI spinner = GameLayoutManager.Get<LoadingSpinnerUI>();
            if (spinner != null) spinner.Show("Fetching Leaderboard...");

            ApiClient api = GameLayoutManager.Get<ApiClient>();
            if (api != null)
            {
                api.GetLeaderboard(
                    entries =>
                    {
                        if (spinner != null) spinner.Hide();
                        ResultUI resultUI = GameLayoutManager.Get<ResultUI>();
                        if (resultUI != null) resultUI.DisplayLeaderboard(entries);
                    },
                    err =>
                    {
                        if (spinner != null) spinner.Hide();
                        Debug.LogError($"[ScenarioRunner] Failed to fetch leaderboard: {err}");
                    }
                );
            }
        }
    }
}
