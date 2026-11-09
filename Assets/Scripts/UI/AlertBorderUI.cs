using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using DisasterSurvival.Core;

namespace DisasterSurvival.UI
{
    /// <summary>
    /// Flashing emergency border that frames the screen in red and amber during disaster alerts.
    /// Fully procedural and parameterized from GameLayoutManager.
    /// </summary>
    public class AlertBorderUI : MonoBehaviour
    {
        private Image _topBorder;
        private Image _bottomBorder;
        private Image _leftBorder;
        private Image _rightBorder;
        private Coroutine _flashCoroutine;

        private void Awake()
        {
            GameLayoutManager.Register(this);
            try
            {
                BuildBorders();
            }
            finally
            {
                gameObject.SetActive(false);
            }
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<AlertBorderUI>();
        }

        private void BuildBorders()
        {
            float thickness = GameLayoutManager.AlertBorderThickness;
            Color initColor = new Color(0.95f, 0.15f, 0.15f, 0.85f);

            // Top
            _topBorder = CreateBorderSegment("TopBorder", new Vector2(0f, 1f), new Vector2(1f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, thickness), initColor);
            // Bottom
            _bottomBorder = CreateBorderSegment("BottomBorder", new Vector2(0f, 0f), new Vector2(1f, 0f), new Vector2(0.5f, 0f), new Vector2(0f, thickness), initColor);
            // Left
            _leftBorder = CreateBorderSegment("LeftBorder", new Vector2(0f, 0f), new Vector2(0f, 1f), new Vector2(0f, 0.5f), new Vector2(thickness, 0f), initColor);
            // Right
            _rightBorder = CreateBorderSegment("RightBorder", new Vector2(1f, 0f), new Vector2(1f, 1f), new Vector2(1f, 0.5f), new Vector2(thickness, 0f), initColor);
        }

        private Image CreateBorderSegment(string name, Vector2 anchorMin, Vector2 anchorMax, Vector2 pivot, Vector2 sizeDelta, Color color)
        {
            GameObject obj = new GameObject(name);
            obj.transform.SetParent(transform, false);

            Image img = obj.AddComponent<Image>();
            img.sprite = UIHelper.CreateWhiteSprite();
            img.color = color;
            img.raycastTarget = false;

            RectTransform rt = obj.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.pivot = pivot;
            rt.sizeDelta = sizeDelta;
            rt.anchoredPosition = Vector2.zero;

            return img;
        }

        public void StartFlashing()
        {
            gameObject.SetActive(true);
            if (_flashCoroutine != null)
            {
                StopCoroutine(_flashCoroutine);
            }
            _flashCoroutine = StartCoroutine(FlashRoutine());
        }

        public void StopFlashing()
        {
            if (_flashCoroutine != null)
            {
                StopCoroutine(_flashCoroutine);
                _flashCoroutine = null;
            }
            gameObject.SetActive(false);
        }

        private IEnumerator FlashRoutine()
        {
            Color colorA = new Color(0.95f, 0.2f, 0.15f, 0.9f); // Crimson
            Color colorB = new Color(1f, 0.75f, 0.1f, 0.9f);   // Amber Warning
            bool toggle = false;

            while (true)
            {
                Color target = toggle ? colorA : colorB;
                toggle = !toggle;

                _topBorder.color = target;
                _bottomBorder.color = target;
                _leftBorder.color = target;
                _rightBorder.color = target;

                yield return new WaitForSeconds(GameLayoutManager.AlertFlashInterval);
            }
        }
    }
}

