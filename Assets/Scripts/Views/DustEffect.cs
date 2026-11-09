using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Procedural square dust particle system built from a pool of SpriteRenderers and coroutines.
    /// Strictly avoids UnityEngine.ParticleSystem to satisfy constraints.
    /// </summary>
    public class DustEffect : MonoBehaviour
    {
        private class DustParticle
        {
            public GameObject GameObject;
            public SpriteRenderer Renderer;
            public Coroutine Routine;
            public bool IsActive;
        }

        private const int PoolSize = 35;
        private readonly List<DustParticle> _pool = new List<DustParticle>();
        private Sprite _squareSprite;
        private Coroutine _ambientTremorRoutine;

        private void Awake()
        {
            CreateSquareSprite();
            InitializePool();
            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<DustEffect>();
        }

        private void CreateSquareSprite()
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

            _squareSprite = Sprite.Create(
                tex,
                new Rect(0, 0, size, size),
                new Vector2(0.5f, 0.5f),
                GameLayoutManager.PixelsPerUnit
            );
        }

        private void InitializePool()
        {
            for (int i = 0; i < PoolSize; i++)
            {
                GameObject pObj = new GameObject($"DustParticle_{i}");
                pObj.transform.SetParent(transform);
                SpriteRenderer sr = pObj.AddComponent<SpriteRenderer>();
                sr.sprite = _squareSprite;
                sr.sortingOrder = GameLayoutManager.SortingOrderDustFront;
                pObj.SetActive(false);

                _pool.Add(new DustParticle
                {
                    GameObject = pObj,
                    Renderer = sr,
                    IsActive = false
                });
            }
        }

        private DustParticle GetAvailableParticle()
        {
            for (int i = 0; i < _pool.Count; i++)
            {
                if (!_pool[i].IsActive)
                {
                    return _pool[i];
                }
            }
            // Return first if all busy
            return _pool[0];
        }

        public void BurstDust(Vector3 center, int count)
        {
            for (int i = 0; i < count; i++)
            {
                DustParticle p = GetAvailableParticle();
                if (p.Routine != null)
                {
                    StopCoroutine(p.Routine);
                }

                Vector2 randomDir = Random.insideUnitCircle.normalized;
                float speed = Random.Range(2f, 6f);
                float lifetime = Random.Range(0.4f, 0.9f);
                float scale = Random.Range(0.2f, 0.6f);
                Color dustColor = new Color(0.85f, 0.83f, 0.8f, Random.Range(0.6f, 0.95f));

                p.Routine = StartCoroutine(AnimateParticle(p, center, randomDir * speed, scale, lifetime, dustColor));
            }
        }

        public void StartTremorDust()
        {
            if (_ambientTremorRoutine != null)
            {
                StopCoroutine(_ambientTremorRoutine);
            }
            _ambientTremorRoutine = StartCoroutine(TremorDustRoutine());
        }

        public void StopTremorDust()
        {
            if (_ambientTremorRoutine != null)
            {
                StopCoroutine(_ambientTremorRoutine);
                _ambientTremorRoutine = null;
            }
        }

        private IEnumerator TremorDustRoutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(0.08f);

                DustParticle p = GetAvailableParticle();
                if (p.Routine != null)
                {
                    StopCoroutine(p.Routine);
                }

                // Random ceiling point
                float randX = Random.Range(-20f, 20f);
                Vector3 spawnPos = new Vector3(randX, 15f, 0f);
                Vector2 velocity = new Vector2(Random.Range(-0.8f, 0.8f), Random.Range(-4f, -7f));
                float lifetime = Random.Range(1.2f, 2.2f);
                float scale = Random.Range(0.15f, 0.45f);
                Color dustColor = new Color(0.9f, 0.88f, 0.85f, Random.Range(0.4f, 0.8f));

                p.Routine = StartCoroutine(AnimateParticle(p, spawnPos, velocity, scale, lifetime, dustColor));
            }
        }

        private IEnumerator AnimateParticle(DustParticle p, Vector3 startPos, Vector2 velocity, float scale, float lifetime, Color color)
        {
            p.IsActive = true;
            p.GameObject.SetActive(true);
            p.GameObject.transform.position = startPos;
            p.GameObject.transform.localScale = Vector3.one * scale;
            p.Renderer.color = color;

            float elapsed = 0f;
            Vector3 currentPos = startPos;

            while (elapsed < lifetime)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / lifetime;

                // Drift and slight gravity
                velocity.y -= 3.5f * Time.deltaTime;
                currentPos += (Vector3)(velocity * Time.deltaTime);
                p.GameObject.transform.position = currentPos;

                // Fade alpha
                Color c = color;
                c.a = Mathf.Lerp(color.a, 0f, progress);
                p.Renderer.color = c;

                yield return null;
            }

            p.GameObject.SetActive(false);
            p.IsActive = false;
            p.Routine = null;
        }
    }
}

