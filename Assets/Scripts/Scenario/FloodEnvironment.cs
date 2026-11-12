using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using DisasterSurvival.Core;
using DisasterSurvival.Character;
using DisasterSurvival.Views;
using DisasterSurvival.UI;
using DisasterSurvival.Audio;

namespace DisasterSurvival.Scenario
{
    /// <summary>Flood scene staging, animated water overlay, and gentle educational outcomes.</summary>
    public class FloodEnvironment : MonoBehaviour, ISimulationEnvironment
    {
        private GameObject _root, _waterOverlay, _sparkRoot, _helicopter, _rescuePose;
        private SpriteRenderer _background, _waterRenderer;
        private SpriteRenderer _characterRenderer;
        private Sprite _normalCharacterSprite;
        private Vector3 _normalCharacterScale;
        private Sprite _firstScene, _secondScene, _thirdScene;
        private Sprite[] _waterFrames;
        private Sprite[] _helicopterFrames;
        private static readonly Dictionary<string, Sprite> FloodPoseSpriteCache = new Dictionary<string, Sprite>();
        private int _beat;

        public void Build(Transform worldRoot)
        {
            Teardown();
            _root = new GameObject("FloodScene");
            if (worldRoot != null) _root.transform.SetParent(worldRoot);
            _firstScene = LoadScene("flood_house_background", new Color(.12f,.18f,.32f));
            _secondScene = LoadScene("flood_second_scene", new Color(.32f,.24f,.18f));
            _thirdScene = LoadScene("flood_rooftop_scene", new Color(.08f,.2f,.4f));
            _waterFrames = Resources.LoadAll<Sprite>("Sprites/Flood/WaterFrames").OrderBy(s => s.name).ToArray();
            _helicopterFrames = Resources.LoadAll<Sprite>("Sprites/Flood/HelicopterFrames").OrderBy(s => s.name).ToArray();

            GameObject bg = new GameObject("FloodSceneBackground"); bg.transform.SetParent(_root.transform);
            _background = bg.AddComponent<SpriteRenderer>();
            _background.sprite = _firstScene;
            _background.sortingOrder = GameLayoutManager.FloodBackgroundOrder;
            bg.transform.position = GameLayoutManager.FloodBackgroundPosition;
            if (_firstScene != null && _firstScene.bounds.size.x > 0f)
                bg.transform.localScale = new Vector3(GameLayoutManager.FloodBackgroundSize.x / _firstScene.bounds.size.x,
                    GameLayoutManager.FloodBackgroundSize.y / _firstScene.bounds.size.y, 1f);

            // The animated GIF is extracted into point-filtered Resources frames by Unity's importer.
            _waterOverlay = new GameObject("FloodWaterAnimation"); _waterOverlay.transform.SetParent(_root.transform);
            _waterRenderer = _waterOverlay.AddComponent<SpriteRenderer>();
            _waterRenderer.sortingOrder = GameLayoutManager.FloodWaterOrder;
            _waterRenderer.color = Color.white;
            _waterOverlay.transform.position = GameLayoutManager.FloodBackgroundPosition + Vector3.forward * -0.1f;
            _waterOverlay.transform.localScale = GameLayoutManager.FloodWaterAnimationScale;
            _waterOverlay.SetActive(false);

            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();
            if (character != null)
            {
                character.gameObject.SetActive(true);
                character.ResetToStart();
                character.transform.position = GameLayoutManager.FloodCharacterStart;
                character.SetSortingOrder(GameLayoutManager.FloodWaterOrder + 1);
                _characterRenderer = character.GetComponent<SpriteRenderer>();
                if (_characterRenderer != null)
                {
                    _normalCharacterSprite = _characterRenderer.sprite;
                    _normalCharacterScale = character.transform.localScale;
                }
            }
        }

        private Sprite LoadScene(string name, Color fallback) => SpriteHelper.LoadOrCreate(
            GameLayoutManager.FloodPath(name), GameLayoutManager.FloodBackgroundSize, fallback, name);

        public IEnumerator PlayBeatIntro(int beatIndex, QuestionData question)
        {
            _beat = beatIndex;
            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();
            BannerUI banner = GameLayoutManager.Get<BannerUI>();
            AudioManager audio = GameLayoutManager.Get<AudioManager>();

            StopFloodEffectSounds(audio);
            if (beatIndex == 0 && audio != null)
                audio.PlaySound(GameLayoutManager.FloodPathAudioAlarm);

            if (beatIndex == 1) SetScene(_secondScene);
            else if (beatIndex == 2) SetScene(_thirdScene);

            if (beatIndex == 0 && banner != null)
            {
                banner.DisplayMessage(GameLayoutManager.FloodIntro, BannerStyle.Standard, true);
                yield return new WaitForSeconds(GameLayoutManager.FloodRiseDuration);
            }
            if (audio != null) audio.PlayLoop(GameLayoutManager.FloodPathAudioRain);
            if (banner != null) banner.DisplayMessage(question.Prompt, BannerStyle.Alert, true);
            yield return new WaitForSeconds(GameLayoutManager.AlertDelayBeforeButtons);
            if (beatIndex == 0 && audio != null) audio.StopSound(GameLayoutManager.FloodPathAudioAlarm);
        }

        public IEnumerator PlayOutcome(string questionId, string optionId, OutcomeType outcomeType)
        {
            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();
            AudioManager audio = GameLayoutManager.Get<AudioManager>();

            if (_beat == 0)
            {
                // Go up the visible left staircase, then play the supplied rising-water animation.
                if (character != null)
                {
                    character.gameObject.SetActive(true);
                    if (optionId == "B")
                    {
                        character.SetState(CharacterState.Moving);
                        SetFloodPose(character, "drowning", GameLayoutManager.FloodDrowningPoseSize,
                            GameLayoutManager.FloodDrowningPosePosition, new Color(.2f,.5f,1f), "drowning_pose");
                        if (audio != null) audio.PlaySound(GameLayoutManager.FloodPathAudioDrowning);
                    }
                    else
                    {
                        if (audio != null) audio.PlaySound(GameLayoutManager.FloodPathAudioClimbing);
                        character.SetState(CharacterState.Moving);
                        yield return MoveCharacter(character, GameLayoutManager.FloodStairTop);
                        if (audio != null) audio.StopSound(GameLayoutManager.FloodPathAudioClimbing);
                        character.SetState(CharacterState.Idle);
                    }
                }
                if (audio != null)
                {
                    audio.PlaySound(GameLayoutManager.FloodPathAudioWater);
                    if (optionId == "B") audio.PlaySound(GameLayoutManager.FloodPathAudioDrowning);
                }
                if (_waterFrames != null && _waterFrames.Length > 0)
                {
                    // Staying downstairs keeps the drowning pose visible over the water.
                    // The safe upstairs choice clears the character for the water montage.
                    if (optionId == "A" && _characterRenderer != null) _characterRenderer.enabled = false;
                    _waterOverlay.SetActive(true);
                    foreach (Sprite frame in _waterFrames)
                    {
                        _waterRenderer.sprite = frame;
                        yield return new WaitForSeconds(GameLayoutManager.FloodWaterFrameDuration);
                    }
                    _waterOverlay.SetActive(false);
                }
                else yield return new WaitForSeconds(GameLayoutManager.FloodRiseDuration);
                if (audio != null)
                {
                    audio.StopSound(GameLayoutManager.FloodPathAudioWater);
                    audio.StopSound(GameLayoutManager.FloodPathAudioDrowning);
                }
                if (character != null)
                {
                    character.transform.position = GameLayoutManager.FloodUpperRoomCharacter;
                    RestoreCharacter(character);
                }
            }
            else if (_beat == 1)
            {
                if (character != null) character.transform.position = GameLayoutManager.FloodUpperRoomCharacter;
                // The flooded sockets arc downstairs in either choice. Choosing to wade in
                // additionally brings the character near the stairs and shows the shock pose.
                if (optionId == "A")
                {
                    if (character != null)
                    {
                        character.SetState(CharacterState.Moving);
                        yield return MoveCharacter(character, GameLayoutManager.FloodElectricStairsPosition);
                        character.SetState(CharacterState.Moving);
                        SetFloodPose(character, "electrocuted", GameLayoutManager.FloodElectrocutedPoseSize,
                            GameLayoutManager.FloodElectricStairsPosition, Color.white, "electrocuted_pose");
                    }
                    if (audio != null) audio.PlaySound(GameLayoutManager.FloodPathAudioShock);
                    yield return StartCoroutine(ShowElectricArcs());
                    if (audio != null) audio.StopSound(GameLayoutManager.FloodPathAudioShock);
                }
                else
                {
                    yield return StartCoroutine(ShowElectricArcs());
                }
                if (character != null)
                {
                    if (audio != null) audio.PlaySound(GameLayoutManager.FloodPathAudioClimbing);
                    character.SetState(CharacterState.Moving);
                    yield return StartCoroutine(ClimbSecondSceneStairs(character));
                    if (audio != null) audio.StopSound(GameLayoutManager.FloodPathAudioClimbing);
                }
                SetScene(_thirdScene);
                if (character != null)
                {
                    character.transform.position = GameLayoutManager.FloodRooftop;
                    RestoreCharacter(character);
                }
            }
            else
            {
                if (optionId == "C" && character != null)
                {
                    if (audio != null) audio.PlaySound(GameLayoutManager.FloodPathAudioPhone);
                    SetRescuePose(character, "calling_911", GameLayoutManager.FloodCallingPoseSize, "calling_911_pose");
                    yield return new WaitForSeconds(GameLayoutManager.FloodCallPauseDuration);
                    if (audio != null) audio.StopSound(GameLayoutManager.FloodPathAudioPhone);
                    SetRescuePose(character, "calling_for_help", GameLayoutManager.FloodHelpPoseSize, "calling_for_help_pose");
                    yield return StartCoroutine(BringInHelicopter());
                    yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration);
                }
                else if (character != null)
                {
                    character.SetState(CharacterState.Hurt);
                    yield return new WaitForSeconds(GameLayoutManager.OutcomeDisplayDuration * .5f);
                    character.SetState(CharacterState.Idle);
                }
            }

            if (_beat == 2 && audio != null)
            {
                StopFloodEffectSounds(audio);
                audio.StopLoop();
            }
        }

        private static void StopFloodEffectSounds(AudioManager audio)
        {
            if (audio == null) return;
            audio.StopSound(GameLayoutManager.FloodPathAudioAlarm);
            audio.StopSound(GameLayoutManager.FloodPathAudioShock);
            audio.StopSound(GameLayoutManager.FloodPathAudioClimbing);
            audio.StopSound(GameLayoutManager.FloodPathAudioWater);
            audio.StopSound(GameLayoutManager.FloodPathAudioHelicopter);
            audio.StopSound(GameLayoutManager.FloodPathAudioPhone);
            audio.StopSound(GameLayoutManager.FloodPathAudioDrowning);
        }

        private void SetFloodPose(CharacterController2D character, string resourceName, Vector2 size,
            Vector3 position, Color fallbackColor, string placeholder)
        {
            if (character == null) return;
            if (_characterRenderer == null) _characterRenderer = character.GetComponent<SpriteRenderer>();
            if (_characterRenderer == null) return;
            Sprite pose = LoadWholeFloodSprite(resourceName, size, fallbackColor, placeholder);
            _characterRenderer.sprite = pose;
            _characterRenderer.color = Color.white;
            _characterRenderer.sortingOrder = GameLayoutManager.FloodWaterOrder + 1;
            Vector2 spriteSize = pose.bounds.size;
            if (spriteSize.x > 0f && spriteSize.y > 0f)
                character.transform.localScale = new Vector3(size.x / spriteSize.x, size.y / spriteSize.y, 1f);
            character.transform.position = position;
        }

        private void RestoreCharacter(CharacterController2D character)
        {
            if (character == null) return;
            character.SetState(CharacterState.Idle);
            if (_characterRenderer != null && _normalCharacterSprite != null)
            {
                _characterRenderer.sprite = _normalCharacterSprite;
                _characterRenderer.color = Color.white;
                _characterRenderer.enabled = true;
                character.transform.localScale = _normalCharacterScale;
            }
        }

        private void SetRescuePose(CharacterController2D character, string resourceName, Vector2 size, string placeholder)
        {
            if (character == null) return;
            if (_characterRenderer == null) _characterRenderer = character.GetComponent<SpriteRenderer>();
            if (_characterRenderer != null) _characterRenderer.enabled = false;
            if (_rescuePose != null) Destroy(_rescuePose);
            _rescuePose = new GameObject("FloodRescueCharacterPose");
            _rescuePose.transform.SetParent(_root.transform);
            var renderer = _rescuePose.AddComponent<SpriteRenderer>();
            renderer.sprite = LoadWholeFloodSprite(resourceName, size, Color.white, placeholder);
            renderer.sortingOrder = GameLayoutManager.FloodWaterOrder + 1;
            Vector2 bounds = renderer.sprite.bounds.size;
            if (bounds.x > 0f && bounds.y > 0f)
                _rescuePose.transform.localScale = new Vector3(size.x / bounds.x, size.y / bounds.y, 1f);
            // Keep the rescue pose at the exact position where the character entered the rooftop scene.
            _rescuePose.transform.position = character.transform.position;
        }

        private static Sprite LoadWholeFloodSprite(string resourceName, Vector2 fallbackSize, Color fallbackColor, string placeholder)
        {
            string path = GameLayoutManager.FloodPath(resourceName);
            if (FloodPoseSpriteCache.TryGetValue(path, out Sprite cached) && cached != null) return cached;

            // Avoid Resources.Load<Sprite>() here: Unity split calling_for_help.png into
            // separate alpha slices, and its first sub-sprite contains only the HELP bubble.
            Texture2D texture = Resources.Load<Texture2D>(path);
            if (texture != null)
            {
                Sprite wholeImage = Sprite.Create(texture, new Rect(0f, 0f, texture.width, texture.height),
                    new Vector2(.5f, .5f), GameLayoutManager.PixelsPerUnit);
                wholeImage.name = resourceName + "_FullImage";
                FloodPoseSpriteCache[path] = wholeImage;
                return wholeImage;
            }

            Sprite fallback = SpriteHelper.LoadOrCreate(path, fallbackSize, fallbackColor, placeholder);
            FloodPoseSpriteCache[path] = fallback;
            return fallback;
        }

        private IEnumerator BringInHelicopter()
        {
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null) audio.PlaySound(GameLayoutManager.FloodPathAudioHelicopter);
            _helicopter = new GameObject("FloodRescueHelicopter");
            _helicopter.transform.SetParent(_root.transform);
            var renderer = _helicopter.AddComponent<SpriteRenderer>();
            if (_helicopterFrames == null || _helicopterFrames.Length == 0)
                _helicopterFrames = Resources.LoadAll<Sprite>("Sprites/Flood/HelicopterFrames").OrderBy(s => s.name).ToArray();
            renderer.sprite = _helicopterFrames != null && _helicopterFrames.Length > 0 ? _helicopterFrames[0] :
                SpriteHelper.LoadOrCreate(GameLayoutManager.FloodPath("rescue_helicopter"), GameLayoutManager.FloodHelicopterSize,
                    new Color(.95f,.45f,.12f), "rescue_helicopter");
            renderer.sortingOrder = GameLayoutManager.FloodWaterOrder + 2;
            Vector2 spriteSize = renderer.sprite.bounds.size;
            if (spriteSize.x > 0f && spriteSize.y > 0f)
                _helicopter.transform.localScale = new Vector3(GameLayoutManager.FloodHelicopterSize.x / spriteSize.x,
                    GameLayoutManager.FloodHelicopterSize.y / spriteSize.y, 1f);
            _helicopter.transform.position = GameLayoutManager.FloodHelicopterStart;
            float elapsed = 0f;
            while (elapsed < GameLayoutManager.FloodHelicopterArrivalDuration)
            {
                elapsed += Time.deltaTime;
                if (_helicopterFrames != null && _helicopterFrames.Length > 0)
                {
                    int frame = Mathf.FloorToInt(elapsed / GameLayoutManager.FloodWaterFrameDuration) % _helicopterFrames.Length;
                    renderer.sprite = _helicopterFrames[frame];
                }
                _helicopter.transform.position = Vector3.Lerp(GameLayoutManager.FloodHelicopterStart,
                    GameLayoutManager.FloodHelicopterTarget, Mathf.Clamp01(elapsed / GameLayoutManager.FloodHelicopterArrivalDuration));
                yield return null;
            }
            _helicopter.transform.position = GameLayoutManager.FloodHelicopterTarget;
            if (audio != null) audio.StopSound(GameLayoutManager.FloodPathAudioHelicopter);
            if (_helicopterFrames != null && _helicopterFrames.Length > 0)
                StartCoroutine(SpinHelicopter(renderer));
        }

        private IEnumerator SpinHelicopter(SpriteRenderer renderer)
        {
            int frame = 0;
            while (renderer != null && _root != null)
            {
                renderer.sprite = _helicopterFrames[frame % _helicopterFrames.Length];
                frame++;
                yield return new WaitForSecondsRealtime(GameLayoutManager.FloodWaterFrameDuration);
            }
        }

        private IEnumerator ShowElectricArcs()
        {
            _sparkRoot = new GameObject("HarmlessElectricalArcs");
            _sparkRoot.transform.SetParent(_root.transform);
            Vector3 origin = GameLayoutManager.FloodElectricArcPosition;
            Color[] colors = { Color.yellow, new Color(1f, .75f, .1f), Color.white, new Color(.3f,.9f,1f) };
            Sprite sparkle = SpriteHelper.LoadOrCreate("FloodSparkle", new Vector2(.5f,.5f), Color.white, "sparkle");
            GameObject[] sparks = new GameObject[8];
            for (int i = 0; i < sparks.Length; i++)
            {
                GameObject spark = new GameObject("ElectricSparkle"); spark.transform.SetParent(_sparkRoot.transform);
                var sr = spark.AddComponent<SpriteRenderer>(); sr.sprite = sparkle;
                sr.color = colors[i % colors.Length]; sr.sortingOrder = GameLayoutManager.FloodWaterOrder + 2;
                spark.transform.localScale = Vector3.one * Random.Range(.2f,.55f);
                spark.transform.rotation = Quaternion.Euler(0f, 0f, 45f);
                sparks[i] = spark;
            }
            int sparkleFrames = Mathf.Max(1, Mathf.CeilToInt(GameLayoutManager.FloodElectricArcPause / 0.09f));
            for (int frame = 0; frame < sparkleFrames; frame++)
            {
                foreach (GameObject spark in sparks)
                {
                    if (spark == null) continue;
                    spark.SetActive(Random.value > .35f);
                    spark.transform.position = origin + new Vector3(Random.Range(-1.7f, 1.7f), Random.Range(-1.5f, 1.5f), -0.2f);
                }
                // Real-time waits keep this short effect bounded even when gameplay time is paused.
                yield return new WaitForSecondsRealtime(.09f);
            }
            if (_sparkRoot != null) Destroy(_sparkRoot);
            _sparkRoot = null;
        }

        private void SetScene(Sprite sprite)
        {
            if (_background != null && sprite != null)
            {
                _background.sprite = sprite;
                if (sprite.bounds.size.x > 0f)
                    _background.transform.localScale = new Vector3(GameLayoutManager.FloodBackgroundSize.x / sprite.bounds.size.x,
                        GameLayoutManager.FloodBackgroundSize.y / sprite.bounds.size.y, 1f);
            }
            if (_waterOverlay != null) _waterOverlay.SetActive(false);
        }

        private IEnumerator MoveCharacter(CharacterController2D character, Vector3 target, float duration = -1f)
        {
            bool done = false;
            float moveDuration = duration > 0f ? duration : GameLayoutManager.RunDuration;
            character.MoveTo(target, moveDuration, () => done = true);
            float elapsed = 0f;
            float timeout = moveDuration + GameLayoutManager.FloodDamagePoseDuration;
            while (!done && character != null && character.gameObject.activeInHierarchy && elapsed < timeout)
            {
                elapsed += Time.deltaTime;
                yield return null;
            }

            // A lost movement callback must never hold the flood scenario on this beat.
            if (!done && character != null)
            {
                character.InterruptMovement();
                character.transform.position = target;
                character.SetState(CharacterState.Idle);
            }
        }

        private IEnumerator ClimbSecondSceneStairs(CharacterController2D character)
        {
            float segmentDuration = GameLayoutManager.RunDuration / 3f;
            yield return MoveCharacter(character, GameLayoutManager.FloodSecondStairWaypoint1, segmentDuration);
            yield return MoveCharacter(character, GameLayoutManager.FloodSecondStairWaypoint2, segmentDuration);
            yield return MoveCharacter(character, GameLayoutManager.FloodSecondStairTop, segmentDuration);
        }

        public void Teardown()
        {
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null)
            {
                StopFloodEffectSounds(audio);
                audio.StopLoop();
            }
            if (_characterRenderer != null && _normalCharacterSprite != null)
            {
                _characterRenderer.enabled = true;
                _characterRenderer.sprite = _normalCharacterSprite;
                _characterRenderer.color = Color.white;
            }
            if (_root != null) Destroy(_root);
            _root = null; _waterOverlay = null; _sparkRoot = null; _helicopter = null; _rescuePose = null;
        }
    }
}
