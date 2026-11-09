using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using DisasterSurvival.Core;
using DisasterSurvival.Audio;

namespace DisasterSurvival.UI
{
    [Serializable]
    public struct DecisionOption
    {
        public string Id;
        public string Label;

        public DecisionOption(string id, string label)
        {
            Id = id;
            Label = label;
        }
    }

    /// <summary>
    /// Displays 2 to 4 large, responsive choice buttons for player decisions.
    /// Interacts seamlessly with mouse and touch inputs through the EventSystem.
    /// </summary>
    public class DecisionUI : MonoBehaviour
    {
        private readonly List<GameObject> _activeButtons = new List<GameObject>();
        private Action<string> _onOptionSelected;

        private void Awake()
        {
            GameLayoutManager.Register(this);
            RectTransform rt = UIHelper.EnsureRectTransform(gameObject);

            rt.anchorMin = new Vector2(0.5f, 0f);
            rt.anchorMax = new Vector2(0.5f, 0f);
            rt.pivot = new Vector2(0.5f, 0f);
            rt.anchoredPosition = GameLayoutManager.DecisionPanelAnchoredPosition;
            rt.sizeDelta = new Vector2(1760f, 220f);

            gameObject.SetActive(false);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<DecisionUI>();
        }

        public void ShowOptions(List<DecisionOption> options, Action<string> onSelected)
        {
            ClearButtons();
            _onOptionSelected = onSelected;
            gameObject.SetActive(true);

            if (options == null || options.Count == 0) return;

            int count = options.Count;
            Vector2 buttonSize = GameLayoutManager.DecisionButtonSize;
            float spacing = GameLayoutManager.DecisionButtonSpacing;

            if (count == 2)
            {
                // Side-by-side layout for 2 choices
                float totalWidth = 2 * buttonSize.x + spacing;
                float startX = -totalWidth * 0.5f + buttonSize.x * 0.5f;

                for (int i = 0; i < 2; i++)
                {
                    string optionId = options[i].Id;
                    string label = $"{options[i].Id}: {options[i].Label}";
                    Vector2 pos = new Vector2(startX + i * (buttonSize.x + spacing), 0f);
                    CreateOptionButton(optionId, label, pos, buttonSize);
                }
            }
            else
            {
                // Stacked or 2x2 grid for 3-4 choices
                for (int i = 0; i < count; i++)
                {
                    string optionId = options[i].Id;
                    string label = $"{options[i].Id}: {options[i].Label}";
                    float yOffset = (count - 1 - i) * (buttonSize.y + 15f) - (count * (buttonSize.y + 15f) * 0.5f);
                    Vector2 pos = new Vector2(0f, yOffset);
                    CreateOptionButton(optionId, label, pos, buttonSize);
                }
            }
        }

        private void CreateOptionButton(string optionId, string label, Vector2 anchoredPos, Vector2 size)
        {
            Color normalColor = new Color(0.18f, 0.45f, 0.8f, 0.98f);
            Color textColor = Color.white;

            Button btn = UIHelper.CreateStyledButton(
                gameObject,
                $"Button_{optionId}",
                label,
                size,
                normalColor,
                textColor,
                26,
                () => OnButtonClicked(optionId)
            );

            RectTransform rt = btn.GetComponent<RectTransform>();
            rt.anchoredPosition = anchoredPos;

            _activeButtons.Add(btn.gameObject);
        }

        private void OnButtonClicked(string optionId)
        {
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null)
            {
                audio.PlaySound(GameLayoutManager.PathAudioClick);
            }

            gameObject.SetActive(false);
            ClearButtons();

            _onOptionSelected?.Invoke(optionId);
        }

        public void ClearButtons()
        {
            for (int i = 0; i < _activeButtons.Count; i++)
            {
                if (_activeButtons[i] != null)
                {
                    Destroy(_activeButtons[i]);
                }
            }
            _activeButtons.Clear();
        }
    }
}

