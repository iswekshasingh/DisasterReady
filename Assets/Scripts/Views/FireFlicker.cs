using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Animates flickering flame sprites (alternating flame_1 and flame_2)
    /// and manages a pool of floating orange embers rising upwards (reusing the DustEffect pooling pattern).
    /// </summary>
    public class FireFlicker : MonoBehaviour
    {
        private class EmberParticle
        {
            public GameObject GameObject;
            public SpriteRenderer Renderer;
            public Coroutine Routine;
            public bool IsActive;
        }

        private SpriteRenderer _flameRenderer;
        private Sprite _flame1;
        private Sprite _flame2;
        private Coroutine _flickerRoutine;
        private Coroutine _emberEmitterRoutine;

        private readonly List<EmberParticle> _emberPool = new List<EmberParticle>();
        private Sprite _emberSquareSprite;

        private void Awake()
        {
            _flameRenderer = gameObject.AddComponent<SpriteRenderer>();
            _flameRenderer.sortingOrder = GameLayoutManager.SortingOrderFireFlames;

            LoadSprites();
            CreateEmberSprite();
            InitializeEmberPool();
        }

        private void LoadSprites()
        {
            _flame1 = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireFlame1,
                GameLayoutManager.FireFlameSize,
                new Color(1f, 0.4f, 0.1f, 1f),
                "flame_1"
            );

            _flame2 = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireFlame2,
                GameLayoutManager.FireFlameSize,
                new Color(1f, 0.6f, 0.15f, 1f),
                "flame_2"
            );

            _flameRenderer.sprite = _flame1;
            FitFlameScale();
        }

        private void FitFlameScale()
        {
            if (_flame1 != null && _flame1.rect.height > 0)
            {
                float spriteW = _flame1.rect.width / _flame1.pixelsPerUnit;
                float spriteH = _flame1.rect.height / _flame1.pixelsPerUnit;
                transform.localScale = new Vector3(
                    GameLayoutManager.FireFlameSize.x / spriteW,
                    GameLayoutManager.FireFlameSize.y / spriteH,
                    1f
                );
            }
        }

        private void CreateEmberSprite()
        {
            int size = 8;
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            Color[] cols = new Color[size * size];
            for (int i = 0; i < cols.Length; i++)
            {
                cols[i] = Color.white;
            }
            tex.SetPixels(cols);
            tex.filterMode = FilterMode.Point;
            tex.Apply();

            _emberSquareSprite = Sprite.Create(
                tex,
                new Rect(0, 0, size, size),
                new Vector2(0.5f, 0.5f),
                GameLayoutManager.PixelsPerUnit
            );
        }

        private void InitializeEmberPool()
        {
            int poolSize = GameLayoutManager.FireEmberPoolSize;
            for (int i = 0; i < poolSize; i++)
            {
                GameObject eObj = new GameObject($"FireEmber_{i}");
                eObj.transform.SetParent(transform);
                SpriteRenderer sr = eObj.AddComponent<SpriteRenderer>();
                sr.sprite = _emberSquareSprite;
                sr.sortingOrder = GameLayoutManager.SortingOrderFireEmbers;
                eObj.SetActive(false);

                _emberPool.Add(new EmberParticle
                {
                    GameObject = eObj,
                    Renderer = sr,
                    IsActive = false
                });
            }
        }

        public void StartFlames()
        {
            gameObject.SetActive(true);
            if (_flickerRoutine != null) StopCoroutine(_flickerRoutine);
            _flickerRoutine = StartCoroutine(FlickerRoutine());

            if (_emberEmitterRoutine != null) StopCoroutine(_emberEmitterRoutine);
            _emberEmitterRoutine = StartCoroutine(EmberEmitterRoutine());
        }

        public void StopFlames()
        {
            if (_flickerRoutine != null)
            {
                StopCoroutine(_flickerRoutine);
                _flickerRoutine = null;
            }
            if (_emberEmitterRoutine != null)
            {
                StopCoroutine(_emberEmitterRoutine);
                _emberEmitterRoutine = null;
            }
            for (int i = 0; i < _emberPool.Count; i++)
            {
                if (_emberPool[i].Routine != null) StopCoroutine(_emberPool[i].Routine);
                _emberPool[i].IsActive = false;
                _emberPool[i].GameObject.SetActive(false);
            }
            gameObject.SetActive(false);
        }

        public void FlareUp(float duration, Action onComplete = null)
        {
            StartCoroutine(FlareRoutine(duration, onComplete));
        }

        private IEnumerator FlareRoutine(float duration, Action onComplete)
        {
            Vector3 origScale = transform.localScale;
            Vector3 flaredScale = origScale * 1.6f;
            float half = duration * 0.4f;
            float elapsed = 0f;

            // Grow
            while (elapsed < half)
            {
                elapsed += Time.deltaTime;
                transform.localScale = Vector3.Lerp(origScale, flaredScale, elapsed / half);
                yield return null;
            }

            // Burst embers
            BurstEmbers(transform.position, 15);

            // Settle
            elapsed = 0f;
            float rest = duration - half;
            while (elapsed < rest)
            {
                elapsed += Time.deltaTime;
                transform.localScale = Vector3.Lerp(flaredScale, origScale, elapsed / rest);
                yield return null;
            }

            transform.localScale = origScale;
            onComplete?.Invoke();
        }

        private IEnumerator FlickerRoutine()
        {
            bool frame = false;
            while (true)
            {
                frame = !frame;
                _flameRenderer.sprite = frame ? _flame1 : _flame2;
                yield return new WaitForSeconds(GameLayoutManager.FireFlickerInterval);
            }
        }

        private EmberParticle GetAvailableEmber()
        {
            for (int i = 0; i < _emberPool.Count; i++)
            {
                if (!_emberPool[i].IsActive) return _emberPool[i];
            }
            return _emberPool[0];
        }

        private void BurstEmbers(Vector3 origin, int count)
        {
            for (int i = 0; i < count; i++)
            {
                EmberParticle ep = GetAvailableEmber();
                if (ep.Routine != null) StopCoroutine(ep.Routine);
                Vector2 dir = new Vector2(UnityEngine.Random.Range(-2f, 2f), UnityEngine.Random.Range(3f, 7f));
                ep.Routine = StartCoroutine(AnimateEmber(ep, origin, dir, UnityEngine.Random.Range(0.2f, 0.5f), UnityEngine.Random.Range(0.6f, 1.2f)));
            }
        }

        private IEnumerator EmberEmitterRoutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(0.1f);
                EmberParticle ep = GetAvailableEmber();
                if (ep.Routine != null) StopCoroutine(ep.Routine);

                Vector3 spawnPos = transform.position + new Vector3(UnityEngine.Random.Range(-1.5f, 1.5f), UnityEngine.Random.Range(-1f, 1f), 0f);
                Vector2 dir = new Vector2(UnityEngine.Random.Range(-0.8f, 0.8f), UnityEngine.Random.Range(2.5f, 5.5f));
                ep.Routine = StartCoroutine(AnimateEmber(ep, spawnPos, dir, UnityEngine.Random.Range(0.15f, 0.35f), UnityEngine.Random.Range(0.8f, 1.6f)));
            }
        }

        private IEnumerator AnimateEmber(EmberParticle ep, Vector3 startPos, Vector2 velocity, float scale, float lifetime)
        {
            ep.IsActive = true;
            ep.GameObject.SetActive(true);
            ep.GameObject.transform.position = startPos;
            ep.GameObject.transform.localScale = new Vector3(scale, scale, 1f);

            Color emberCol = GameLayoutManager.FireEmberColor;
            float elapsed = 0f;

            while (elapsed < lifetime)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / lifetime;

                // Move upwards with slight wobble
                float wobbleX = Mathf.Sin(progress * 10f) * 0.05f;
                ep.GameObject.transform.position += new Vector3((velocity.x + wobbleX) * Time.deltaTime, velocity.y * Time.deltaTime, 0f);

                // Fade alpha
                Color cur = emberCol;
                cur.a = Mathf.Lerp(emberCol.a, 0f, progress);
                ep.Renderer.color = cur;

                yield return null;
            }

            ep.IsActive = false;
            ep.GameObject.SetActive(false);
            ep.Routine = null;
        }

        private void OnDestroy()
        {
            StopAllCoroutines();
        }
    }
}

