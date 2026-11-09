using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DisasterSurvival.Core;
using DisasterSurvival.Views;
using DisasterSurvival.Character;
using DisasterSurvival.UI;
using DisasterSurvival.Audio;
using DisasterSurvival.Backend;

namespace DisasterSurvival.Scenario
{
    /// <summary>
    /// Data-driven engine that runs the beats of a disaster simulation.
    /// Drives animation sequences, cameras, dust, debris, banner dialogues, and decision prompts.
    /// Tracks chosen answers and duration, submitting to backend or rendering offline evaluations.
    /// </summary>
    public class ScenarioRunner : MonoBehaviour
    {
        private ScenarioData _currentScenario;
        private readonly List<AnswerSubmission> _recordedAnswers = new List<AnswerSubmission>();
        private int _safeDecisionsCount = 0;
        private float _simulationStartTime = 0f;
        private string _activeScenarioBackendId = "";

        private void Awake()
        {
            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<ScenarioRunner>();
        }

        public void StartOfflineSimulation()
        {
            _currentScenario = ScenarioData.CreateDefaultEarthquakeScenario();
            _activeScenarioBackendId = _currentScenario.ScenarioId;
            StartCoroutine(RunSimulationFlow());
        }

        public void StartBackendSimulation(ScenarioDetail detail)
        {
            _activeScenarioBackendId = detail.GetId();
            _currentScenario = ConvertDetailToScenario(detail);
            StartCoroutine(RunSimulationFlow());
        }

        private ScenarioData ConvertDetailToScenario(ScenarioDetail detail)
        {
            // Base on default earthquake scenario to preserve outcome mappings
            ScenarioData data = ScenarioData.CreateDefaultEarthquakeScenario();
            data.ScenarioId = detail.GetId();
            data.ScenarioTitle = !string.IsNullOrEmpty(detail.title) ? detail.title : data.ScenarioTitle;

            // If backend provided questions, adopt their text/labels while preserving IDs
            if (detail.questions != null && detail.questions.Count > 0)
            {
                data.Questions.Clear();
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
                    data.Questions.Add(new QuestionData(qItem.id, qItem.prompt, opts));
                }
            }

            return data;
        }

        private IEnumerator RunSimulationFlow()
        {
            _recordedAnswers.Clear();
            _safeDecisionsCount = 0;
            _simulationStartTime = Time.time;

            // Reset world objects
            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();
            if (character != null) character.ResetToStart();

            BackgroundView backgroundView = GameLayoutManager.Get<BackgroundView>();
            if (backgroundView != null) backgroundView.SetNormal();

            DebrisController debris = GameLayoutManager.Get<DebrisController>();
            if (debris != null) debris.ResetDebris();

            CameraShake cameraShake = GameLayoutManager.Get<CameraShake>();
            if (cameraShake != null) cameraShake.StopShake();

            DustEffect dust = GameLayoutManager.Get<DustEffect>();
            if (dust != null) dust.StopTremorDust();

            BannerUI banner = GameLayoutManager.Get<BannerUI>();
            DecisionUI decision = GameLayoutManager.Get<DecisionUI>();
            AlertBorderUI alertBorder = GameLayoutManager.Get<AlertBorderUI>();
            AudioManager audio = GameLayoutManager.Get<AudioManager>();

            // =========================================================================
            // BEAT 1: PRE-SHAKING GOVERNMENT ALERT (id: EQ_Q1)
            // =========================================================================
            Debug.Log("[ScenarioRunner] Starting Beat 1...");
            if (alertBorder != null) alertBorder.StartFlashing();
            if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSiren);

            if (banner != null)
            {
                banner.DisplayMessage(GameLayoutManager.TextAlertGovernment, BannerStyle.Alert, true);
            }
            else
            {
                Debug.LogError("[ScenarioRunner] BannerUI is null!");
            }

            // Wait for alert delay before revealing choices
            Debug.Log($"[ScenarioRunner] Waiting {GameLayoutManager.AlertDelayBeforeButtons}s before showing choices...");
            yield return new WaitForSeconds(GameLayoutManager.AlertDelayBeforeButtons);

            if (alertBorder != null) alertBorder.StopFlashing();

            QuestionData q1 = GetQuestion(0);
            Debug.Log($"[ScenarioRunner] Showing {q1.Options.Count} options for question {q1.Id}: {q1.Prompt}");
            string chosen1 = null;
            if (decision != null)
            {
                decision.ShowOptions(q1.Options, opt =>
                {
                    Debug.Log($"[ScenarioRunner] Player chose option: {opt}");
                    chosen1 = opt;
                });
            }
            else
            {
                Debug.LogError("[ScenarioRunner] DecisionUI is null!");
            }

            while (chosen1 == null) yield return null;
            RecordAnswer(q1.Id, chosen1);

            // Execute Beat 1 Outcome Animation
            if (chosen1 == GameLayoutManager.EQ_Q1_OptionA_Id)
            {
                // Option A: Hide Under Table (Safe)
                bool walked = false;
                if (character != null) character.WalkToTable(() => walked = true);
                while (!walked) yield return null;

                OutcomeInfo outcome = _currentScenario.GetOutcome(q1.Id, chosen1);
                if (banner != null) banner.DisplayMessage(outcome.Message, BannerStyle.Safe, true);
                if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSuccess);
            }
            else
            {
                // Option B: Run Outside (Harm)
                if (character != null) character.RunTowardDoor();
                yield return new WaitForSeconds(0.7f);

                // Mid-run tremor starts
                if (character != null) character.InterruptMovement();
                if (cameraShake != null) cameraShake.Shake(1.5f, 0.25f);
                if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioRumble);

                OutcomeInfo outcome = _currentScenario.GetOutcome(q1.Id, chosen1);
                if (banner != null) banner.DisplayMessage(outcome.Message, BannerStyle.Harm, true);
                if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioFail);
            }

            yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);

            // If the player attempted to run outside in Beat 1, scramble back under the table to take cover before major shaking starts
            if (chosen1 == GameLayoutManager.EQ_Q1_OptionB_Id && character != null)
            {
                bool scrambled = false;
                character.WalkToTable(() => scrambled = true);
                while (!scrambled) yield return null;
            }

            // =========================================================================
            // BEAT 2: DURING SHAKING (id: EQ_Q2)
            // =========================================================================
            if (backgroundView != null) backgroundView.SetDamaged();
            if (cameraShake != null) cameraShake.Shake(GameLayoutManager.ShakeDuration * 3f, GameLayoutManager.ShakeStrength);
            if (dust != null) dust.StartTremorDust();
            if (audio != null) audio.PlayLoop(GameLayoutManager.PathAudioRumble);

            QuestionData q2 = GetQuestion(1);
            if (banner != null) banner.DisplayMessage(q2.Prompt, BannerStyle.Alert, true);

            string chosen2 = null;
            if (decision != null)
            {
                decision.ShowOptions(q2.Options, opt => chosen2 = opt);
            }

            while (chosen2 == null) yield return null;
            RecordAnswer(q2.Id, chosen2);

            // Execute Beat 2 Outcome Animation
            if (chosen2 == GameLayoutManager.EQ_Q2_OptionA_Id)
            {
                // Option A: Stay under cover (Safe)
                bool debrisLanded = false;
                if (debris != null) debris.DropDebrisOnTable(() => debrisLanded = true);
                while (!debrisLanded) yield return null;

                OutcomeInfo outcome = _currentScenario.GetOutcome(q2.Id, chosen2);
                if (banner != null) banner.DisplayMessage(outcome.Message, BannerStyle.Safe, true);
                if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSuccess);
            }
            else
            {
                // Option B: Crawl out and run for the door (Harm)
                if (character != null)
                {
                    character.SetState(CharacterState.Moving);
                    character.RunTowardDoor();
                }

                yield return new WaitForSeconds(0.4f);

                bool debrisLanded = false;
                if (debris != null) debris.DropDebrisOnPath(() => debrisLanded = true);
                while (!debrisLanded) yield return null;

                if (character != null) character.TriggerHurt();

                OutcomeInfo outcome = _currentScenario.GetOutcome(q2.Id, chosen2);
                if (banner != null) banner.DisplayMessage(outcome.Message, BannerStyle.Harm, true);
                if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioFail);
            }

            yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);

            // =========================================================================
            // BEAT 3: AFTER SHAKING / EVACUATION (id: EQ_Q3)
            // =========================================================================
            if (cameraShake != null) cameraShake.StopShake();
            if (dust != null) dust.StopTremorDust();
            if (audio != null) audio.StopLoop();

            QuestionData q3 = GetQuestion(2);
            if (banner != null) banner.DisplayMessage(q3.Prompt, BannerStyle.Standard, true);

            string chosen3 = null;
            if (decision != null)
            {
                decision.ShowOptions(q3.Options, opt => chosen3 = opt);
            }

            while (chosen3 == null) yield return null;
            RecordAnswer(q3.Id, chosen3);

            // Execute Beat 3 Outcome Animation
            if (chosen3 == GameLayoutManager.EQ_Q3_OptionA_Id)
            {
                // Option A: Use Stairs (Safe)
                if (character != null)
                {
                    character.SetState(CharacterState.Moving);
                    character.RunTowardDoor(null, () => character.SetState(CharacterState.Safe));
                }

                OutcomeInfo outcome = _currentScenario.GetOutcome(q3.Id, chosen3);
                if (banner != null) banner.DisplayMessage(outcome.Message, BannerStyle.Safe, true);
                if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSuccess);
            }
            else
            {
                // Option B: Take Elevator (Harm)
                if (character != null) character.TriggerHurt();

                OutcomeInfo outcome = _currentScenario.GetOutcome(q3.Id, chosen3);
                if (banner != null) banner.DisplayMessage(outcome.Message, BannerStyle.Harm, true);
                if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioFail);
            }

            yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);

            if (banner != null) banner.Clear();

            // =========================================================================
            // SUBMISSION & RESULTS
            // =========================================================================
            int totalElapsedSeconds = Mathf.Max(1, Mathf.RoundToInt(Time.time - _simulationStartTime));

            if (GameLayoutManager.useBackend)
            {
                SubmitToBackend(totalElapsedSeconds);
            }
            else
            {
                ShowOfflineResults();
            }
        }

        private QuestionData GetQuestion(int index)
        {
            if (_currentScenario != null && _currentScenario.Questions.Count > index)
            {
                return _currentScenario.Questions[index];
            }
            // Fallback empty question
            return new QuestionData($"Q_{index + 1}", "What will you do next?", new List<DecisionOption>());
        }

        private void RecordAnswer(string questionId, string optionId)
        {
            _recordedAnswers.Add(new AnswerSubmission(questionId, optionId));

            OutcomeInfo outcome = _currentScenario.GetOutcome(questionId, optionId);
            if (outcome != null && outcome.Outcome == OutcomeType.Safe)
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
                    _currentScenario.Questions.Count,
                    () => StartOfflineSimulation()
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
                            onPlayAgain: () => StartOfflineSimulation(),
                            onOpenLeaderboard: () => FetchAndShowLeaderboard()
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
