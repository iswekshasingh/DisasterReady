using System;
using System.Collections;
using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Renders a semi-transparent dark smoke blanket across the upper screen that descends towards the floor.
    /// Animates with drifting alpha and pulse to simulate billows of rising hot smoke.
    /// A safe breathing zone remains near the floor below SmokeSafeLineY.
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer))]
    public class SmokeLayer : MonoBehaviour
    {
        private SpriteRenderer _renderer;
        private Coroutine _descendRoutine;
        private Coroutine _driftRoutine;

        private void Awake()
        {
            _renderer = GetComponent<SpriteRenderer>();
            _renderer.sortingOrder = GameLayoutManager.SortingOrderFireSmoke;
            SetupSprite();
            transform.position = GameLayoutManager.SmokeLayerStartPosition;
        }

        private void SetupSprite()
        {
            Sprite sprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireSmokeOverlay,
                GameLayoutManager.SmokeLayerSize,
                GameLayoutManager.SmokeColor,
                "smoke_overlay"
            );
            _renderer.sprite = sprite;

            if (sprite != null && sprite.rect.height > 0)
            {
                float spriteW = sprite.rect.width / sprite.pixelsPerUnit;
                float spriteH = sprite.rect.height / sprite.pixelsPerUnit;
                transform.localScale = new Vector3(
                    GameLayoutManager.SmokeLayerSize.x / spriteW,
                    GameLayoutManager.SmokeLayerSize.y / spriteH,
                    1f
                );
            }

            _renderer.color = GameLayoutManager.SmokeColor;
        }

        private void Start()
        {
            StartDrift();
        }

        private void OnDestroy()
        {
            StopAllCoroutines();
        }

        public void StartDrift()
        {
            if (_driftRoutine != null) StopCoroutine(_driftRoutine);
            _driftRoutine = StartCoroutine(DriftAlphaRoutine());
        }

        public void DescendSmoke(Action onComplete = null)
        {
            if (_descendRoutine != null) StopCoroutine(_descendRoutine);
            _descendRoutine = StartCoroutine(DescendRoutine(onComplete));
        }

        public void ResetSmoke()
        {
            if (_descendRoutine != null)
            {
                StopCoroutine(_descendRoutine);
                _descendRoutine = null;
            }
            transform.position = GameLayoutManager.SmokeLayerStartPosition;
            _renderer.color = GameLayoutManager.SmokeColor;
        }

        private IEnumerator DescendRoutine(Action onComplete)
        {
            Vector3 startPos = transform.position;
            Vector3 targetPos = GameLayoutManager.SmokeLayerDescendPosition;
            float duration = GameLayoutManager.SmokeDescendDuration;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                float smoothT = Mathf.SmoothStep(0f, 1f, t);
                transform.position = Vector3.Lerp(startPos, targetPos, smoothT);
                yield return null;
            }

            transform.position = targetPos;
            _descendRoutine = null;
            onComplete?.Invoke();
        }

        private IEnumerator DriftAlphaRoutine()
        {
            float baseAlpha = GameLayoutManager.SmokeColor.a;
            while (true)
            {
                float pulse = Mathf.Sin(Time.time * 1.5f) * 0.08f;
                Color c = GameLayoutManager.SmokeColor;
                c.a = Mathf.Clamp01(baseAlpha + pulse);
                _renderer.color = c;
                yield return null;
            }
        }
    }
}

