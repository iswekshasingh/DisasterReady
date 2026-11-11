using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using DisasterSurvival.Core;

namespace DisasterSurvival.UI
{
    public enum BannerStyle
    {
        Standard,
        Alert,
        Safe,
        Harm
    }

    /// <summary>
    /// Bottom text banner that displays scenario prompts and outcomes with a typewriter effect.
    /// Supports color accents for Alert, Safe, and Harm states.
    /// </summary>
    public class BannerUI : MonoBehaviour
    {
        private Image _accentBar;
        private Text _dialogueText;
        private Coroutine _typewriterCoroutine;
        private Action _onTypewriterComplete;

        private void Awake()
        {
            BuildUI();
            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<BannerUI>();
        }

        private void BuildUI()
        {
            RectTransform rt = UIHelper.EnsureRectTransform(gameObject);

            rt.anchorMin = new Vector2(0.5f, 0f);
            rt.anchorMax = new Vector2(0.5f, 0f);
            rt.pivot = new Vector2(0.5f, 0f);
            rt.anchoredPosition = GameLayoutManager.BannerAnchoredPosition;
            rt.sizeDelta = GameLayoutManager.BannerSize;

            // Background panel
            Image bg = gameObject.AddComponent<Image>();
            bg.sprite = UIHelper.CreateWhiteSprite();
            bg.color = new Color(0.08f, 0.1f, 0.14f, 0.92f);

            // Left accent bar
            GameObject barObj = new GameObject("AccentBar");
            barObj.transform.SetParent(transform, false);
            _accentBar = barObj.AddComponent<Image>();
            _accentBar.sprite = UIHelper.CreateWhiteSprite();
            _accentBar.color = new Color(0.2f, 0.6f, 0.9f, 1f);

            RectTransform barRt = barObj.GetComponent<RectTransform>();
            barRt.anchorMin = new Vector2(0f, 0f);
            barRt.anchorMax = new Vector2(0f, 1f);
            barRt.pivot = new Vector2(0f, 0.5f);
            barRt.anchoredPosition = Vector2.zero;
            barRt.sizeDelta = new Vector2(16f, 0f);

            // Dialogue text
            GameObject textContainer = new GameObject("TextContainer");
            textContainer.transform.SetParent(transform, false);
            RectTransform textRt = UIHelper.EnsureRectTransform(textContainer);
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = new Vector2(40f, 20f);
            textRt.offsetMax = new Vector2(-40f, -20f);

            _dialogueText = textContainer.AddComponent<Text>();
            _dialogueText.font = UIHelper.GetDefaultFont();
            _dialogueText.fontSize = 32;
            _dialogueText.color = Color.white;
            _dialogueText.alignment = TextAnchor.MiddleLeft;
            _dialogueText.horizontalOverflow = HorizontalWrapMode.Wrap;
            _dialogueText.verticalOverflow = VerticalWrapMode.Truncate;
        }

        public void SetStyle(BannerStyle style)
        {
            switch (style)
            {
                case BannerStyle.Alert:
                    _accentBar.color = new Color(1f, 0.75f, 0.1f, 1f); // Warning amber
                    _dialogueText.color = new Color(1f, 0.95f, 0.7f, 1f);
                    break;
                case BannerStyle.Safe:
                    _accentBar.color = new Color(0.2f, 0.9f, 0.4f, 1f); // Success green
                    _dialogueText.color = new Color(0.85f, 1f, 0.85f, 1f);
                    break;
                case BannerStyle.Harm:
                    _accentBar.color = new Color(0.95f, 0.25f, 0.2f, 1f); // Danger red
                    _dialogueText.color = new Color(1f, 0.85f, 0.85f, 1f);
                    break;
                default:
                    _accentBar.color = new Color(0.3f, 0.65f, 0.95f, 1f); // Standard blue
                    _dialogueText.color = Color.white;
                    break;
            }
        }

        public void DisplayMessage(
    string message,
    BannerStyle style = BannerStyle.Standard,
    bool typewriter = true,
    Action onComplete = null)
{
    // Activate the banner before starting its coroutine
    if (!gameObject.activeSelf)
    {
        gameObject.SetActive(true);
    }

    SetStyle(style);
    _onTypewriterComplete = onComplete;

    if (_typewriterCoroutine != null)
    {
        StopCoroutine(_typewriterCoroutine);
        _typewriterCoroutine = null;
    }

    if (typewriter)
    {
        _typewriterCoroutine = StartCoroutine(TypewriterRoutine(message));
    }
    else
    {
        _dialogueText.text = message;
        _onTypewriterComplete?.Invoke();
    }
}

        private IEnumerator TypewriterRoutine(string fullText)
        {
            _dialogueText.text = "";
            float speed = GameLayoutManager.TypewriterSpeed;

            for (int i = 0; i <= fullText.Length; i++)
            {
                _dialogueText.text = fullText.Substring(0, i);
                yield return new WaitForSeconds(speed);
            }

            _typewriterCoroutine = null;
            _onTypewriterComplete?.Invoke();
        }

        public void Clear()
        {
            if (_typewriterCoroutine != null)
            {
                StopCoroutine(_typewriterCoroutine);
                _typewriterCoroutine = null;
            }
            _dialogueText.text = "";
        }

        public void Hide()
        {
            Clear();
            gameObject.SetActive(false);
        }
    }
}
