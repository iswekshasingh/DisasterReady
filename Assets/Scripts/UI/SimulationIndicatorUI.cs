using UnityEngine;
using UnityEngine.UI;
using DisasterSurvival.Core;

namespace DisasterSurvival.UI
{
    /// <summary>
    /// Displays a subtle simulation counter and title header during gameplay (e.g. "Simulation 1 of 2: Earthquake Preparedness").
    /// </summary>
    public class SimulationIndicatorUI : MonoBehaviour
    {
        private Text _indicatorText;
        private Image _bgPill;

        private void Awake()
        {
            BuildUI();
            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<SimulationIndicatorUI>();
        }

        private void BuildUI()
        {
            RectTransform rt = UIHelper.EnsureRectTransform(gameObject);
            rt.anchorMin = new Vector2(0.5f, 1f);
            rt.anchorMax = new Vector2(0.5f, 1f);
            rt.pivot = new Vector2(0.5f, 1f);
            rt.anchoredPosition = new Vector2(0f, -18f);
            rt.sizeDelta = new Vector2(580f, 44f);

            _bgPill = gameObject.AddComponent<Image>();
            _bgPill.sprite = UIHelper.CreateWhiteSprite();
            _bgPill.color = new Color(0.06f, 0.08f, 0.12f, 0.78f);

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(transform, false);
            _indicatorText = textObj.AddComponent<Text>();
            _indicatorText.font = UIHelper.GetDefaultFont();
            _indicatorText.fontSize = 20;
            _indicatorText.color = new Color(0.85f, 0.92f, 1f, 1f);
            _indicatorText.alignment = TextAnchor.MiddleCenter;

            RectTransform textRt = UIHelper.EnsureRectTransform(textObj);
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;
        }

        public void SetSimulation(int currentOneBased, int totalCount, string title, bool offlineTestMode = false)
        {
            string modeSuffix = offlineTestMode ? " (Offline Test Mode)" : "";
            _indicatorText.text = $"Simulation {currentOneBased} of {totalCount}: {title}{modeSuffix}";
            gameObject.SetActive(true);
        }

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
        }

        public void Hide()
        {
            gameObject.SetActive(false);
        }
    }
}

