using System;
using System.Collections;
using UnityEngine;
using DisasterSurvival.Core;
using DisasterSurvival.UI;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Interactive fire door with heat check indicator.
    /// Tweens a back-of-hand icon to the door surface.
    /// If hot, triggers an orange heat glow effect. If cool, opens smoothly without heat glow.
    /// Never random: driven strictly by OutcomeMap logic.
    /// </summary>
    public class DoorHeatCheck : MonoBehaviour
    {
        private SpriteRenderer _doorRenderer;
        private SpriteRenderer _glowRenderer;
        private GameObject _handObj;
        private SpriteRenderer _handRenderer;

        private Sprite _spriteClosed;
        private Sprite _spriteOpen;
        private Coroutine _glowRoutine;

        private void Awake()
        {
            SetupDoor();
            SetupGlow();
            SetupHandIcon();
        }

        private void SetupDoor()
        {
            _doorRenderer = gameObject.AddComponent<SpriteRenderer>();
            _doorRenderer.sortingOrder = GameLayoutManager.SortingOrderFireDoor;
            transform.position = GameLayoutManager.FireDoorPosition;

            _spriteClosed = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireDoorClosed,
                GameLayoutManager.FireDoorSize,
                new Color(0.45f, 0.25f, 0.12f, 1f),
                "door_closed"
            );

            _spriteOpen = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireDoorOpen,
                GameLayoutManager.FireDoorSize,
                new Color(0.35f, 0.2f, 0.1f, 1f),
                "door_open"
            );

            _doorRenderer.sprite = _spriteClosed;
            // The room background already has the closed door painted; suppress duplicate door overlay
            _doorRenderer.enabled = false;

            if (_spriteClosed != null && _spriteClosed.rect.height > 0)
            {
                float w = _spriteClosed.rect.width / _spriteClosed.pixelsPerUnit;
                float h = _spriteClosed.rect.height / _spriteClosed.pixelsPerUnit;
                transform.localScale = new Vector3(
                    GameLayoutManager.FireDoorSize.x / w,
                    GameLayoutManager.FireDoorSize.y / h,
                    1f
                );
            }
        }

        private void SetupGlow()
        {
            GameObject glowObj = new GameObject("HeatGlow");
            glowObj.transform.SetParent(transform);
            glowObj.transform.localPosition = Vector3.zero;
            glowObj.transform.localScale = Vector3.one * 1.08f;

            _glowRenderer = glowObj.AddComponent<SpriteRenderer>();
            _glowRenderer.sortingOrder = GameLayoutManager.SortingOrderFireDoor + 1;
            _glowRenderer.sprite = _spriteClosed != null ? _spriteClosed : UIHelper.CreateWhiteSprite();
            _glowRenderer.color = Color.clear;
        }

        private void SetupHandIcon()
        {
            _handObj = new GameObject("HandHeatCheckIcon");
            _handObj.transform.SetParent(transform.parent);
            _handObj.transform.position = GameLayoutManager.HandIconStartPos;

            _handRenderer = _handObj.AddComponent<SpriteRenderer>();
            _handRenderer.sortingOrder = GameLayoutManager.SortingOrderFireHandIcon;
            _handRenderer.sprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireHandIcon,
                GameLayoutManager.HandIconSize,
                new Color(0.95f, 0.85f, 0.7f, 1f),
                "hand_icon"
            );

            if (_handRenderer.sprite != null && _handRenderer.sprite.rect.height > 0)
            {
                float w = _handRenderer.sprite.rect.width / _handRenderer.sprite.pixelsPerUnit;
                float h = _handRenderer.sprite.rect.height / _handRenderer.sprite.pixelsPerUnit;
                _handObj.transform.localScale = new Vector3(
                    GameLayoutManager.HandIconSize.x / w,
                    GameLayoutManager.HandIconSize.y / h,
                    1f
                );
            }

            _handObj.SetActive(false);
        }

        public void PerformHeatCheck(bool isHot, Action onComplete)
        {
            StartCoroutine(HeatCheckRoutine(isHot, onComplete));
        }

        public void OpenDoor(Action onComplete = null)
        {
            // Door opening animation removed as requested; door illustration in room background remains intact
            onComplete?.Invoke();
        }

        public void ResetDoor()
        {
            StopAllCoroutines();
            _doorRenderer.enabled = false;
            _doorRenderer.sprite = _spriteClosed;
            if (_glowRenderer != null) _glowRenderer.color = Color.clear;
            if (_handObj != null)
            {
                _handObj.transform.position = GameLayoutManager.HandIconStartPos;
                _handObj.SetActive(false);
            }
        }

        private IEnumerator HeatCheckRoutine(bool isHot, Action onComplete)
        {
            _handObj.SetActive(true);
            _handObj.transform.position = GameLayoutManager.HandIconStartPos;

            Vector3 startPos = GameLayoutManager.HandIconStartPos;
            Vector3 targetPos = GameLayoutManager.HandIconTargetPos;
            float duration = GameLayoutManager.HandMoveDuration;
            float elapsed = 0f;

            // Move hand to door
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                _handObj.transform.position = Vector3.Lerp(startPos, targetPos, Mathf.SmoothStep(0f, 1f, t));
                yield return null;
            }

            _handObj.transform.position = targetPos;

            if (isHot)
            {
                // Pulsate intense warning heat glow
                if (_glowRoutine != null) StopCoroutine(_glowRoutine);
                _glowRoutine = StartCoroutine(HeatGlowRoutine());
                yield return new WaitForSeconds(0.6f);
            }
            else
            {
                // Cool door: brief gentle green tint pulse to indicate safe temperature
                yield return new WaitForSeconds(0.4f);
            }

            // Move hand away
            elapsed = 0f;
            while (elapsed < duration * 0.6f)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / (duration * 0.6f));
                _handObj.transform.position = Vector3.Lerp(targetPos, startPos, t);
                yield return null;
            }

            _handObj.SetActive(false);
            onComplete?.Invoke();
        }

        private IEnumerator HeatGlowRoutine()
        {
            float elapsed = 0f;
            Color glowColor = GameLayoutManager.DoorHeatGlowColor;
            while (elapsed < 3f)
            {
                elapsed += Time.deltaTime;
                float pulse = (Mathf.Sin(elapsed * 12f) + 1f) * 0.5f;
                Color cur = glowColor;
                cur.a = Mathf.Lerp(0.2f, 0.85f, pulse);
                _glowRenderer.color = cur;
                yield return null;
            }
            _glowRenderer.color = Color.clear;
        }

        private void OnDestroy()
        {
            StopAllCoroutines();
        }
    }
}

