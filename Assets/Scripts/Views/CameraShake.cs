using System.Collections;
using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Custom camera shake using smooth coroutines. No Cinemachine or external plugins.
    /// Restores exact initial position after completion.
    /// </summary>
    public class CameraShake : MonoBehaviour
    {
        private Vector3 _originalPosition;
        private Coroutine _shakeCoroutine;

        private void Awake()
        {
            _originalPosition = transform.position;
            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<CameraShake>();
        }

        public void Shake(float duration, float strength)
        {
            if (_shakeCoroutine != null)
            {
                StopCoroutine(_shakeCoroutine);
            }
            _shakeCoroutine = StartCoroutine(ShakeRoutine(duration, strength));
        }

        public void StopShake()
        {
            if (_shakeCoroutine != null)
            {
                StopCoroutine(_shakeCoroutine);
                _shakeCoroutine = null;
            }
            transform.position = _originalPosition;
        }

        private IEnumerator ShakeRoutine(float duration, float strength)
        {
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float currentStrength = Mathf.Lerp(strength, 0f, elapsed / duration);

                float offsetX = (Random.value * 2f - 1f) * currentStrength;
                float offsetY = (Random.value * 2f - 1f) * currentStrength;

                transform.position = _originalPosition + new Vector3(offsetX, offsetY, 0f);
                yield return null;
            }

            transform.position = _originalPosition;
            _shakeCoroutine = null;
        }
    }
}

