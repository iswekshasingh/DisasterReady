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
    /// Encapsulates the visual environment, beat intros, hazards, and outcome animations for Simulation 2 (Building Fire & Evacuation).
    /// </summary>
    public class FireEnvironment : MonoBehaviour, ISimulationEnvironment
    {
        private GameObject _environmentRoot;
        private SpriteRenderer _bgRenderer;
        private Sprite _roomBgSprite;
        private Sprite _corridorBgSprite;
        private Sprite _refugeBgSprite;

        private DoorHeatCheck _doorHeatCheck;
        private FireFlicker _fireFlicker;
        private SmokeLayer _smokeLayer;
        private ExitRouteView _exitRouteView;

        public void Build(Transform worldRoot)
        {
            if (_environmentRoot != null)
            {
                Teardown();
            }

            _environmentRoot = new GameObject("FireEnvironment");
            if (worldRoot != null)
            {
                _environmentRoot.transform.SetParent(worldRoot);
            }

            // 1. Background (swappable between apartment room, corridor, and refuge balcony)
            GameObject bgObj = new GameObject("FireBackground");
            bgObj.transform.SetParent(_environmentRoot.transform);
            _bgRenderer = bgObj.AddComponent<SpriteRenderer>();
            _bgRenderer.sortingOrder = GameLayoutManager.SortingOrderFireBackground;
            bgObj.transform.position = GameLayoutManager.FireRoomBgPosition;

            _roomBgSprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireRoomBg,
                GameLayoutManager.FireRoomBgSize,
                new Color(0.32f, 0.22f, 0.2f, 1f),
                "fire_room_background"
            );

            _corridorBgSprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireCorridorBg,
                GameLayoutManager.FireCorridorBgSize,
                new Color(0.24f, 0.26f, 0.3f, 1f),
                "fire_corridor_background"
            );

            _refugeBgSprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireRefugeBg,
                GameLayoutManager.FireRefugeBgSize,
                new Color(0.2f, 0.25f, 0.35f, 1f),
                "fire_refuge_background"
            );

            SetBackgroundRoom();

            // 2. Door with heat check
            GameObject doorObj = new GameObject("FireDoor");
            doorObj.transform.SetParent(_environmentRoot.transform);
            _doorHeatCheck = doorObj.AddComponent<DoorHeatCheck>();

            // 3. Flames & Embers (positioned near door or character)
            GameObject flameObj = new GameObject("FireFlames");
            flameObj.transform.SetParent(_environmentRoot.transform);
            flameObj.transform.position = GameLayoutManager.FireFlameDoorPosition;
            _fireFlicker = flameObj.AddComponent<FireFlicker>();
            _fireFlicker.StopFlames(); // Hidden initially

            // 4. Smoke Layer (starts at ceiling)
            GameObject smokeObj = new GameObject("SmokeLayer");
            smokeObj.transform.SetParent(_environmentRoot.transform);
            _smokeLayer = smokeObj.AddComponent<SmokeLayer>();

            // 5. Exit Route View (stairs, elevator, exit sign)
            GameObject routeObj = new GameObject("ExitRouteView");
            routeObj.transform.SetParent(_environmentRoot.transform);
            _exitRouteView = routeObj.AddComponent<ExitRouteView>();
            _exitRouteView.SetVisible(false);

            // 6. Reset Character for Fire simulation
            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();
            if (character != null)
            {
                character.gameObject.SetActive(true);
                character.ResetToStart();
                character.transform.position = GameLayoutManager.CharacterFireStartPos;
                character.SetSortingOrder(GameLayoutManager.SortingOrderFireCharacter);
            }
        }

        private void SetBackgroundRoom()
        {
            if (_bgRenderer != null && _roomBgSprite != null)
            {
                _bgRenderer.sprite = _roomBgSprite;
                FitBgToCamera();
            }
        }

        private void SetBackgroundCorridor()
        {
            if (_bgRenderer != null)
            {
                _bgRenderer.sprite = _corridorBgSprite != null ? _corridorBgSprite : _roomBgSprite;
                FitBgToCamera();
            }
        }

        private void SetBackgroundRefuge()
        {
            if (_bgRenderer != null)
            {
                _bgRenderer.sprite = _refugeBgSprite != null ? _refugeBgSprite : _corridorBgSprite;
                FitBgToCamera();
            }
        }

        private void FitBgToCamera()
        {
            if (_bgRenderer == null || _bgRenderer.sprite == null) return;
            float spriteW = _bgRenderer.sprite.rect.width / _bgRenderer.sprite.pixelsPerUnit;
            float spriteH = _bgRenderer.sprite.rect.height / _bgRenderer.sprite.pixelsPerUnit;
            if (spriteW <= 0 || spriteH <= 0) return;

            float cameraHeight = GameLayoutManager.OrthographicSize * 2f;
            float cameraWidth = cameraHeight * (GameLayoutManager.ReferenceResolution.x / GameLayoutManager.ReferenceResolution.y);

            float scale = Mathf.Max(cameraWidth / spriteW, cameraHeight / spriteH);
            _bgRenderer.transform.localScale = new Vector3(scale, scale, 1f);
        }

        public IEnumerator PlayBeatIntro(int beatIndex, QuestionData question)
        {
            AlertBorderUI alertBorder = GameLayoutManager.Get<AlertBorderUI>();
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            BannerUI banner = GameLayoutManager.Get<BannerUI>();
            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();

            switch (beatIndex)
            {
                case 0:
                    // Beat 1: Fire alarm ringing in the apartment room
                    SetBackgroundRoom();
                    if (_doorHeatCheck != null) _doorHeatCheck.gameObject.SetActive(true);
                    if (_smokeLayer != null) _smokeLayer.gameObject.SetActive(true);
                    if (_exitRouteView != null) _exitRouteView.SetVisible(false);

                    if (character != null)
                    {
                        character.gameObject.SetActive(true);
                        character.transform.position = GameLayoutManager.CharacterFireStartPos;
                        character.SetState(CharacterState.Idle);
                    }

                    if (alertBorder != null) alertBorder.StartFlashing();
                    if (audio != null) audio.PlayLoop(GameLayoutManager.PathAudioFireAlarm);

                    if (banner != null)
                    {
                        banner.DisplayMessage(GameLayoutManager.TextAlertFire, BannerStyle.Alert, true);
                    }

                    yield return new WaitForSeconds(GameLayoutManager.AlertDelayBeforeButtons);
                    if (alertBorder != null) alertBorder.StopFlashing();
                    break;

                case 1:
                    // Beat 2: Transition into the smoky corridor
                    SetBackgroundCorridor();
                    if (_doorHeatCheck != null) _doorHeatCheck.gameObject.SetActive(false);
                    if (_fireFlicker != null) _fireFlicker.StopFlames();
                    if (_exitRouteView != null) _exitRouteView.SetVisible(false);

                    if (character != null)
                    {
                        character.gameObject.SetActive(true);
                        // Standing firmly on the corridor tiled floor (feet at Y = -6.5f, center at Y = -2.5f)
                        character.transform.position = GameLayoutManager.CharacterCorridorStartPos;
                        character.SetState(CharacterState.Idle);
                    }

                    if (_smokeLayer != null)
                    {
                        _smokeLayer.gameObject.SetActive(true);
                        _smokeLayer.ResetSmoke();
                        _smokeLayer.DescendSmoke();
                    }

                    if (audio != null)
                    {
                        audio.StopLoop();
                        audio.PlayLoop(GameLayoutManager.PathAudioFlameCrackle);
                    }

                    if (banner != null)
                    {
                        banner.DisplayMessage(question.Prompt, BannerStyle.Alert, true);
                    }
                    break;

                case 2:
                    // Beat 3: The Refuge Area (balcony refuge scene)
                    if (audio != null)
                    {
                        audio.StopLoop();
                        audio.PlayLoop(GameLayoutManager.PathAudioFireTruck);
                    }
                    SetBackgroundRefuge();

                    if (_smokeLayer != null)
                    {
                        _smokeLayer.ResetSmoke();
                        _smokeLayer.gameObject.SetActive(false);
                    }
                    if (_exitRouteView != null) _exitRouteView.SetVisible(false);
                    if (_doorHeatCheck != null) _doorHeatCheck.gameObject.SetActive(false);
                    if (_fireFlicker != null) _fireFlicker.StopFlames();

                    // Protagonist is illustrated directly on the balcony in the refuge background artwork
                    if (character != null)
                    {
                        character.gameObject.SetActive(false);
                    }

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

            // BEAT 1 (FR_Q1): The Door
            if (questionId == GameLayoutManager.FR_Q1_Id || questionId.EndsWith("1"))
            {
                if (optionId == GameLayoutManager.FR_Q1_OptionA_Id)
                {
                    // Option A: Open door and run out (Harm) - Door stays closed, fire flares on character
                    bool moved = false;
                    if (character != null) character.MoveTo(GameLayoutManager.CharacterDoorCheckPos, 0.6f, () => moved = true);
                    while (!moved) yield return null;

                    // Add fire animation directly on character
                    if (_fireFlicker != null)
                    {
                        Vector3 flamePos = (character != null)
                            ? character.transform.position + new Vector3(0.3f, 0.4f, 0f)
                            : GameLayoutManager.CharacterDoorCheckPos;
                        _fireFlicker.transform.position = flamePos;
                        _fireFlicker.transform.localScale = new Vector3(0.55f, 0.55f, 1f);
                        _fireFlicker.StartFlames();
                        _fireFlicker.FlareUp(0.8f);
                    }

                    if (cameraShake != null) cameraShake.Shake(0.5f, 0.2f);
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioFail);
                    if (character != null) character.TriggerHurt();

                    if (banner != null) banner.DisplayMessage(GameLayoutManager.FR_Q1_Harm_Message, BannerStyle.Harm, true);
                    yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);

                    if (_fireFlicker != null)
                    {
                        _fireFlicker.StopFlames();
                        _fireFlicker.transform.localScale = Vector3.one;
                    }
                    if (character != null) character.SetState(CharacterState.Idle);
                }
                else
                {
                    // Option B: Check door with back of hand first (Safe) - Hand checks door, door does not open
                    bool checkedDoor = false;
                    if (character != null) character.MoveTo(GameLayoutManager.CharacterDoorCheckPos, 0.6f);
                    yield return new WaitForSeconds(0.65f);

                    if (_doorHeatCheck != null)
                    {
                        _doorHeatCheck.PerformHeatCheck(false, () => checkedDoor = true);
                    }
                    else
                    {
                        checkedDoor = true;
                    }
                    while (!checkedDoor) yield return null;

                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSuccess);
                    if (banner != null) banner.DisplayMessage(GameLayoutManager.FR_Q1_Safe_Message, BannerStyle.Safe, true);
                    yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);
                }
            }
            // BEAT 2 (FR_Q2): The Smoke & Hallway
            else if (questionId == GameLayoutManager.FR_Q2_Id || questionId.EndsWith("2"))
            {
                if (optionId == GameLayoutManager.FR_Q2_OptionA_Id)
                {
                    // Option A: Stand up straight and run (Harm) - Inhales toxic smoke
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioCough);
                    bool moved = false;
                    if (character != null)
                    {
                        character.MoveTo(new Vector3(0f, -2.5f, 0f), 0.9f, () => moved = true);
                    }
                    while (!moved) yield return null;

                    if (character != null)
                    {
                        character.Cough(1.2f);
                        character.TriggerHurt();
                    }
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioFail);

                    if (banner != null) banner.DisplayMessage(GameLayoutManager.FR_Q2_Harm_Message, BannerStyle.Harm, true);
                    yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);
                }
                else
                {
                    // Option B: Stay low and crawl under smoke (Safe) - Crawls straight through hallway along floor
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioCough);
                    bool crawled = false;
                    if (character != null)
                    {
                        character.CrawlTo(GameLayoutManager.CharacterCrawlEndPos, 2.2f, () => crawled = true);
                    }
                    while (!crawled) yield return null;

                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSuccess);
                    if (banner != null) banner.DisplayMessage(GameLayoutManager.FR_Q2_Safe_Message, BannerStyle.Safe, true);
                    yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);
                }
            }
            // BEAT 3 (FR_Q3): The Refuge Area
            else
            {
                if (optionId == GameLayoutManager.FR_Q3_OptionB_Id)
                {
                    // Option B: Wait for rescue in the refuge area (Safe)
                    if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioSuccess);
                    if (banner != null) banner.DisplayMessage(GameLayoutManager.FR_Q3_Safe_Refuge_Message, BannerStyle.Safe, true);
                    yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);
                }
                else if (optionId == GameLayoutManager.FR_Q3_OptionA_Id)
                {
                    // Option A: Take elevator (Harm)
                    if (audio != null)
                    {
                        audio.PlaySound(GameLayoutManager.PathAudioCharHurt);
                        audio.PlaySound(GameLayoutManager.PathAudioFail);
                    }
                    if (banner != null) banner.DisplayMessage(GameLayoutManager.FR_Q3_Harm_Elevator_Message, BannerStyle.Harm, true);
                    yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);
                }
                else
                {
                    // Option C: Go back for belongings (Harm)
                    if (audio != null)
                    {
                        audio.PlaySound(GameLayoutManager.PathAudioCharHurt);
                        audio.PlaySound(GameLayoutManager.PathAudioFail);
                    }
                    if (banner != null) banner.DisplayMessage(GameLayoutManager.FR_Q3_Harm_Belongings_Message, BannerStyle.Harm, true);
                    yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);
                }
            }
        }

        public void Teardown()
        {
            // Teardown can be called once by ScenarioRunner and again by OnDestroy.
            // A repeated call must not stop the loop belonging to a newly started sim.
            if (_environmentRoot == null) return;

            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null) audio.StopLoop();

            CameraShake cameraShake = GameLayoutManager.Get<CameraShake>();
            if (cameraShake != null) cameraShake.StopShake();

            if (_fireFlicker != null) _fireFlicker.StopFlames();
            if (_smokeLayer != null) _smokeLayer.ResetSmoke();

            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();
            if (character != null)
            {
                character.gameObject.SetActive(true);
                character.ResetToStart();
            }

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

