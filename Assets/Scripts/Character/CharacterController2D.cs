using System;
using System.Collections;
using UnityEngine;
using DisasterSurvival.Core;
using DisasterSurvival.Views;

namespace DisasterSurvival.Character
{
    public enum CharacterState
    {
        Idle,
        Waiting,
        Moving,
        Hiding,
        Safe,
        Hurt
    }

    /// <summary>
    /// Controls character states, movement coroutines, subtle idle bobbing, and sprite swaps.
    /// No hardcoded coordinates; reads all positions and durations from GameLayoutManager.
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer))]
    public class CharacterController2D : MonoBehaviour
    {
        private SpriteRenderer _renderer;
        private CharacterState _currentState = CharacterState.Idle;
        private Coroutine _movementCoroutine;
        private Coroutine _idleBobCoroutine;

        private Sprite _spriteIdle;
        private Sprite _spriteHiding;
        private Sprite _spriteRun;
        private Sprite _spriteHurt;

        public CharacterState CurrentState => _currentState;

        private void Awake()
        {
            _renderer = GetComponent<SpriteRenderer>();
            _renderer.sortingOrder = GameLayoutManager.SortingOrderCharacter;
            LoadSprites();
            GameLayoutManager.Register(this);
        }

        private void Start()
        {
            ResetToStart();
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<CharacterController2D>();
        }

        private void LoadSprites()
        {
            Vector2 size = GameLayoutManager.CharacterSize;
            _spriteIdle = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteCharIdle,
                size,
                new Color(0.2f, 0.65f, 0.9f, 1f),
                "char_idle"
            );

            _spriteHiding = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteCharHiding,
                new Vector2(size.x, size.y * 0.6f),
                new Color(0.2f, 0.55f, 0.8f, 1f),
                "char_hiding"
            );

            _spriteRun = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteCharRun,
                size,
                new Color(0.25f, 0.75f, 0.95f, 1f),
                "char_run"
            );

            _spriteHurt = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteCharHurt,
                size,
                new Color(0.95f, 0.35f, 0.25f, 1f),
                "char_hurt"
            );
        }

        public void ResetToStart()
        {
            StopAllCoroutines();
            _movementCoroutine = null;
            _idleBobCoroutine = null;
            if (_renderer != null) _renderer.color = Color.white;
            transform.position = GameLayoutManager.CharacterStartPosition;
            SetState(CharacterState.Idle);
            StartIdleBob();
        }

        public void SetState(CharacterState newState)
        {
            CharacterState previousState = _currentState;
            _currentState = newState;

            switch (_currentState)
            {
                case CharacterState.Idle:
                case CharacterState.Waiting:
                    _renderer.sprite = _spriteIdle;
                    break;
                case CharacterState.Moving:
                    _renderer.sprite = _spriteRun != null ? _spriteRun : _spriteIdle;
                    break;
                case CharacterState.Hiding:
                    _renderer.sprite = _spriteHiding;
                    break;
                case CharacterState.Safe:
                    _renderer.sprite = _spriteIdle;
                    break;
                case CharacterState.Hurt:
                    _renderer.sprite = _spriteHurt;
                    break;
            }

            // Adjust vertical position between standing and crouching so feet remain planted on floor
            if (previousState == CharacterState.Hiding && _currentState != CharacterState.Hiding)
            {
                transform.position = new Vector3(transform.position.x, GameLayoutManager.CharacterStartPosition.y, transform.position.z);
            }
            else if (previousState != CharacterState.Hiding && _currentState == CharacterState.Hiding)
            {
                transform.position = new Vector3(transform.position.x, GameLayoutManager.CharacterHidePosition.y, transform.position.z);
            }

            UpdateScaleForCurrentState();
        }

        private void UpdateScaleForCurrentState()
        {
            if (_renderer == null || _renderer.sprite == null || _renderer.sprite.rect.height <= 0) return;
            float spriteH = _renderer.sprite.rect.height / _renderer.sprite.pixelsPerUnit;
            float targetH = (_currentState == CharacterState.Hiding) ? GameLayoutManager.CharacterHidingHeight : GameLayoutManager.CharacterStandingHeight;
            float scale = targetH / spriteH;
            transform.localScale = new Vector3(scale, scale, 1f);
        }

        public void WalkToTable(Action onComplete = null)
        {
            StopIdleBob();
            SetState(CharacterState.Moving);

            if (_movementCoroutine != null)
            {
                StopCoroutine(_movementCoroutine);
            }

            Vector3 startPos = new Vector3(transform.position.x, GameLayoutManager.CharacterStartPosition.y, transform.position.z);
            transform.position = startPos;
            Vector3 walkTargetPos = new Vector3(GameLayoutManager.CharacterHidePosition.x, GameLayoutManager.CharacterStartPosition.y, 0f);
            float duration = GameLayoutManager.WalkToTableDuration;

            _movementCoroutine = StartCoroutine(MoveRoutine(startPos, walkTargetPos, duration, () =>
            {
                transform.position = GameLayoutManager.CharacterHidePosition;
                SetState(CharacterState.Hiding);
                onComplete?.Invoke();
            }));
        }

        public void RunTowardDoor(Action onInterrupted = null, Action onComplete = null)
        {
            StopIdleBob();
            SetState(CharacterState.Moving);

            if (_movementCoroutine != null)
            {
                StopCoroutine(_movementCoroutine);
            }

            Vector3 startPos = new Vector3(transform.position.x, GameLayoutManager.CharacterStartPosition.y, transform.position.z);
            transform.position = startPos;
            Vector3 targetPos = GameLayoutManager.CharacterRunTarget;
            float duration = GameLayoutManager.RunDuration;

            _movementCoroutine = StartCoroutine(MoveRoutine(startPos, targetPos, duration, () =>
            {
                onComplete?.Invoke();
            }));
        }

        public void InterruptMovement()
        {
            if (_movementCoroutine != null)
            {
                StopCoroutine(_movementCoroutine);
                _movementCoroutine = null;
            }
        }

        public void TriggerHurt()
        {
            InterruptMovement();
            SetState(CharacterState.Hurt);
            StartCoroutine(HurtFlashRoutine());
        }

        private IEnumerator MoveRoutine(Vector3 start, Vector3 end, float duration, Action onFinished)
        {
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                // Smooth step interpolation
                float smoothT = Mathf.SmoothStep(0f, 1f, t);
                transform.position = Vector3.Lerp(start, end, smoothT);
                yield return null;
            }

            transform.position = end;
            _movementCoroutine = null;
            onFinished?.Invoke();
        }

        private void StartIdleBob()
        {
            if (_idleBobCoroutine != null)
            {
                StopCoroutine(_idleBobCoroutine);
            }
            _idleBobCoroutine = StartCoroutine(IdleBobRoutine());
        }

        private void StopIdleBob()
        {
            if (_idleBobCoroutine != null)
            {
                StopCoroutine(_idleBobCoroutine);
                _idleBobCoroutine = null;
            }
        }

        private IEnumerator IdleBobRoutine()
        {
            Vector3 basePos = transform.position;
            while (_currentState == CharacterState.Idle || _currentState == CharacterState.Waiting)
            {
                float offset = Mathf.Sin(Time.time * GameLayoutManager.IdleBobSpeed) * GameLayoutManager.IdleBobAmount;
                transform.position = new Vector3(basePos.x, basePos.y + offset, basePos.z);
                yield return null;
            }
        }

        private IEnumerator HurtFlashRoutine()
        {
            Color origColor = _renderer.color;
            for (int i = 0; i < 4; i++)
            {
                _renderer.color = new Color(1f, 0.2f, 0.2f, 1f);
                yield return new WaitForSeconds(0.12f);
                _renderer.color = origColor;
                yield return new WaitForSeconds(0.12f);
            }
        }
    }
}

