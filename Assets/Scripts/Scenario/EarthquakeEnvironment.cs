using System;
using System.Collections;
using UnityEngine;
using DisasterSurvival.Core;
using DisasterSurvival.Views;
using DisasterSurvival.Character;
using DisasterSurvival.UI;
using DisasterSurvival.Audio;

namespace DisasterSurvival.Scenario
{
    /// <summary>
    /// Encapsulates the visual environment, beat intros, and outcome animations for Simulation 1 (Earthquake).
    /// Preserves exact visual, timing, and gameplay behavior of the original earthquake scenario.
    /// </summary>
    public class EarthquakeEnvironment : MonoBehaviour, ISimulationEnvironment
    {
        private GameObject _environmentRoot;
        private BackgroundView _backgroundView;
        private DoorView _doorView;
        private TableView _tableView;
        private DebrisController _debrisController;
        private DustEffect _dustEffect;

        public void Build(Transform worldRoot)
        {
            if (_environmentRoot != null)
            {
                Teardown();
            }

            _environmentRoot = new GameObject("EarthquakeEnvironment");
            if (worldRoot != null)
            {
                _environmentRoot.transform.SetParent(worldRoot);
            }

            // Background
            GameObject bgObj = new GameObject("BackgroundView");
            bgObj.transform.SetParent(_environmentRoot.transform);
            bgObj.AddComponent<SpriteRenderer>();
            _backgroundView = bgObj.AddComponent<BackgroundView>();

            // Door
            GameObject doorObj = new GameObject("DoorView");
            doorObj.transform.SetParent(_environmentRoot.transform);
            doorObj.AddComponent<SpriteRenderer>();
            _doorView = doorObj.AddComponent<DoorView>();

            // Table
            GameObject tableObj = new GameObject("TableView");
            tableObj.transform.SetParent(_environmentRoot.transform);
            tableObj.AddComponent<SpriteRenderer>();
            _tableView = tableObj.AddComponent<TableView>();

            // Ceiling Debris Controller
            GameObject debrisObj = new GameObject("DebrisController");
            debrisObj.transform.SetParent(_environmentRoot.transform);
            _debrisController = debrisObj.AddComponent<DebrisController>();

            // Dust Effect Pool
            GameObject dustObj = new GameObject("DustEffect");
            dustObj.transform.SetParent(_environmentRoot.transform);
            _dustEffect = dustObj.AddComponent<DustEffect>();

            // Ensure character is positioned for Earthquake
            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();
            if (character != null)
            {
                // The simulation picker hides the persistent player object. Reactivate it
                // before resetting so its renderer and idle coroutine can run again.
                character.gameObject.SetActive(true);
                character.ResetToStart();
                character.SetSortingOrder(GameLayoutManager.SortingOrderCharacter);
            }
        }

        public IEnumerator PlayBeatIntro(int beatIndex, QuestionData question)
        {
            AlertBorderUI alertBorder = GameLayoutManager.Get<AlertBorderUI>();
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            BannerUI banner = GameLayoutManager.Get<BannerUI>();
            CameraShake cameraShake = GameLayoutManager.Get<CameraShake>();

            switch (beatIndex)
            {
                case 0:
                    // Beat 1: Pre-shaking alert
                    if (alertBorder != null) alertBorder.StartFlashing();
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSiren);

                    if (banner != null)
                    {
                        banner.DisplayMessage(GameLayoutManager.TextAlertGovernment, BannerStyle.Alert, true);
                    }

                    yield return new WaitForSeconds(GameLayoutManager.AlertDelayBeforeButtons);
                    if (alertBorder != null) alertBorder.StopFlashing();
                    break;

                case 1:
                    // Beat 2: During shaking
                    if (_backgroundView != null) _backgroundView.SetDamaged();
                    if (cameraShake != null) cameraShake.Shake(GameLayoutManager.ShakeDuration * 3f, GameLayoutManager.ShakeStrength);
                    if (_dustEffect != null) _dustEffect.StartTremorDust();
                    if (audio != null) audio.PlayLoop(GameLayoutManager.PathAudioRumble);

                    if (banner != null)
                    {
                        banner.DisplayMessage(question.Prompt, BannerStyle.Alert, true);
                    }
                    break;

                case 2:
                    // Beat 3: Post-shaking evacuation
                    if (cameraShake != null) cameraShake.StopShake();
                    if (_dustEffect != null) _dustEffect.StopTremorDust();
                    if (audio != null) audio.StopLoop();

                    if (banner != null)
                    {
                        banner.DisplayMessage(question.Prompt, BannerStyle.Standard, true);
                    }
                    break;
            }
        }

        public IEnumerator PlayOutcome(string questionId, string optionId, OutcomeType outcomeType)
        {
            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();
            BannerUI banner = GameLayoutManager.Get<BannerUI>();
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            CameraShake cameraShake = GameLayoutManager.Get<CameraShake>();

            // BEAT 1 (EQ_Q1) OUTCOMES
            if (questionId == GameLayoutManager.EQ_Q1_Id || questionId.EndsWith("1"))
            {
                if (optionId == GameLayoutManager.EQ_Q1_OptionA_Id)
                {
                    // Option A: Hide Under Table (Safe)
                    bool walked = false;
                    if (character != null)
                    {
                        character.WalkToTable(() => walked = true);
                        while (!walked) yield return null;
                    }

                    if (banner != null) banner.DisplayMessage(GameLayoutManager.EQ_Q1_Safe_Message, BannerStyle.Safe, true);
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSuccess);
                }
                else
                {
                    // Option B: Run Outside (Harm)
                    if (character != null) character.RunTowardDoor();
                    yield return new WaitForSeconds(0.7f);

                    // Mid-run tremor starts
                    if (character != null)
                    {
                        character.InterruptMovement();
                        character.TriggerHurt();
                    }
                    if (cameraShake != null) cameraShake.Shake(1.5f, 0.25f);
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioRumble);

                    if (banner != null) banner.DisplayMessage(GameLayoutManager.EQ_Q1_Harm_Message, BannerStyle.Harm, true);
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioFail);
                }

                yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);

                // Scramble back under table if ran out
                if (optionId == GameLayoutManager.EQ_Q1_OptionB_Id && character != null)
                {
                    bool scrambled = false;
                    character.WalkToTable(() => scrambled = true);
                    while (!scrambled) yield return null;
                }
            }
            // BEAT 2 (EQ_Q2) OUTCOMES
            else if (questionId == GameLayoutManager.EQ_Q2_Id || questionId.EndsWith("2"))
            {
                if (optionId == GameLayoutManager.EQ_Q2_OptionA_Id)
                {
                    // Option A: Stay under cover (Safe)
                    bool debrisLanded = false;
                    if (_debrisController != null)
                    {
                        _debrisController.DropDebrisOnTable(() => debrisLanded = true);
                        while (!debrisLanded) yield return null;
                    }

                    if (banner != null) banner.DisplayMessage(GameLayoutManager.EQ_Q2_Safe_Message, BannerStyle.Safe, true);
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
                    if (_debrisController != null)
                    {
                        _debrisController.DropDebrisOnPath(() => debrisLanded = true);
                        while (!debrisLanded) yield return null;
                    }

                    if (character != null) character.TriggerHurt();

                    if (banner != null) banner.DisplayMessage(GameLayoutManager.EQ_Q2_Harm_Message, BannerStyle.Harm, true);
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioFail);
                }

                yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);
            }
            // BEAT 3 (EQ_Q3) OUTCOMES
            else
            {
                if (optionId == GameLayoutManager.EQ_Q3_OptionA_Id)
                {
                    // Option A: Use Stairs (Safe)
                    if (character != null)
                    {
                        character.SetState(CharacterState.Moving);
                        character.RunTowardDoor(null, () => character.SetState(CharacterState.Safe));
                    }

                    if (banner != null) banner.DisplayMessage(GameLayoutManager.EQ_Q3_Safe_Message, BannerStyle.Safe, true);
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSuccess);
                }
                else
                {
                    // Option B: Take Elevator (Harm)
                    if (character != null) character.TriggerHurt();

                    if (banner != null) banner.DisplayMessage(GameLayoutManager.EQ_Q3_Harm_Message, BannerStyle.Harm, true);
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioFail);
                }

                yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);
            }
        }

        public void Teardown()
        {
            // ScenarioRunner already tears down the environment before destroying its
            // component. OnDestroy calls this again later; don't let that second pass
            // stop audio started by the next simulation.
            if (_environmentRoot == null) return;

            CameraShake cameraShake = GameLayoutManager.Get<CameraShake>();
            if (cameraShake != null) cameraShake.StopShake();

            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null) audio.StopLoop();

            if (_debrisController != null) _debrisController.ResetDebris();
            if (_dustEffect != null) _dustEffect.StopTremorDust();

            if (_environmentRoot != null)
            {
                Destroy(_environmentRoot);
                _environmentRoot = null;
            }
        }

        private void OnDestroy()
        {
            Teardown();
        }
    }
}

