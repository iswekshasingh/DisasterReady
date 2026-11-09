using System;
using System.Collections;
using UnityEngine;
using DisasterSurvival.Core;
using DisasterSurvival.Audio;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Controls ceiling debris objects that crash down during tremors.
    /// Manages falling tweens, collision impacts, sound effects, and dust bursts.
    /// </summary>
    public class DebrisController : MonoBehaviour
    {
        private GameObject _debris1;
        private GameObject _debris2;
        private SpriteRenderer _debris1Renderer;
        private SpriteRenderer _debris2Renderer;

        private void Awake()
        {
            SetupDebrisObjects();
            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<DebrisController>();
        }

        private void SetupDebrisObjects()
        {
            // Debris 1 (lands on table)
            _debris1 = new GameObject("CeilingDebris_Table");
            _debris1.transform.SetParent(transform);
            _debris1.transform.position = GameLayoutManager.Debris1StartPosition;
            _debris1Renderer = _debris1.AddComponent<SpriteRenderer>();
            _debris1Renderer.sortingOrder = GameLayoutManager.SortingOrderDebris;
            _debris1Renderer.sprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteDebris,
                GameLayoutManager.Debris1Size,
                new Color(0.6f, 0.62f, 0.65f, 1f),
                "debris"
            );
            if (_debris1Renderer.sprite != null && _debris1Renderer.sprite.rect.height > 0)
            {
                float spriteW = _debris1Renderer.sprite.rect.width / _debris1Renderer.sprite.pixelsPerUnit;
                float spriteH = _debris1Renderer.sprite.rect.height / _debris1Renderer.sprite.pixelsPerUnit;
                _debris1.transform.localScale = new Vector3(
                    GameLayoutManager.Debris1Size.x / spriteW,
                    GameLayoutManager.Debris1Size.y / spriteH,
                    1f
                );
            }
            _debris1.SetActive(false);

            // Debris 2 (lands on run path)
            _debris2 = new GameObject("CeilingDebris_Path");
            _debris2.transform.SetParent(transform);
            _debris2.transform.position = GameLayoutManager.Debris2StartPosition;
            _debris2Renderer = _debris2.AddComponent<SpriteRenderer>();
            _debris2Renderer.sortingOrder = GameLayoutManager.SortingOrderDebris;
            _debris2Renderer.sprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteDebris,
                GameLayoutManager.Debris2Size,
                new Color(0.55f, 0.57f, 0.6f, 1f),
                "debris"
            );
            if (_debris2Renderer.sprite != null && _debris2Renderer.sprite.rect.height > 0)
            {
                float spriteW = _debris2Renderer.sprite.rect.width / _debris2Renderer.sprite.pixelsPerUnit;
                float spriteH = _debris2Renderer.sprite.rect.height / _debris2Renderer.sprite.pixelsPerUnit;
                _debris2.transform.localScale = new Vector3(
                    GameLayoutManager.Debris2Size.x / spriteW,
                    GameLayoutManager.Debris2Size.y / spriteH,
                    1f
                );
            }
            _debris2.SetActive(false);
        }

        public void ResetDebris()
        {
            StopAllCoroutines();
            if (_debris1 != null)
            {
                _debris1.transform.position = GameLayoutManager.Debris1StartPosition;
                _debris1.SetActive(false);
            }
            if (_debris2 != null)
            {
                _debris2.transform.position = GameLayoutManager.Debris2StartPosition;
                _debris2.SetActive(false);
            }
        }

        public void DropDebrisOnTable(Action onComplete = null)
        {
            StartCoroutine(FallRoutine(
                _debris1,
                GameLayoutManager.Debris1StartPosition,
                GameLayoutManager.Debris1LandingPosition,
                GameLayoutManager.DebrisFallDuration,
                onComplete
            ));
        }

        public void DropDebrisOnPath(Action onComplete = null)
        {
            StartCoroutine(FallRoutine(
                _debris2,
                GameLayoutManager.Debris2StartPosition,
                GameLayoutManager.Debris2LandingPosition,
                GameLayoutManager.DebrisFallDuration,
                onComplete
            ));
        }

        private IEnumerator FallRoutine(GameObject debrisObj, Vector3 startPos, Vector3 targetPos, float duration, Action onComplete)
        {
            debrisObj.SetActive(true);
            debrisObj.transform.position = startPos;

            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                // Accelerating gravity curve
                float curvedT = t * t;
                debrisObj.transform.position = Vector3.Lerp(startPos, targetPos, curvedT);
                yield return null;
            }

            debrisObj.transform.position = targetPos;

            // Audio & dust impact
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null)
            {
                audio.PlaySound(GameLayoutManager.PathAudioDebrisCrash);
            }

            DustEffect dust = GameLayoutManager.Get<DustEffect>();
            if (dust != null)
            {
                dust.BurstDust(targetPos, 14);
            }

            onComplete?.Invoke();
        }
    }
}

