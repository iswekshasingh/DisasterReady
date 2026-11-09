using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using DisasterSurvival.Core;

namespace DisasterSurvival.UI
{
    /// <summary>
    /// Displays a loading spinner overlay with custom prompt text during backend submission.
    /// Procedural spinning square/indicator built with coroutine rotation.
    /// </summary>
    public class LoadingSpinnerUI : MonoBehaviour
    {
        private GameObject _spinnerIcon;
        private Text _spinnerText;
        private Coroutine _spinCoroutine;

        private void Awake()
        {
            GameLayoutManager.Register(this);
            try
            {
                BuildUI();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[LoadingSpinnerUI] Build error: {ex}");
            }
            finally
            {
                gameObject.SetActive(false);
            }
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<LoadingSpinnerUI>();
        }

        private void BuildUI()
        {
            RectTransform rt = UIHelper.EnsureRectTransform(gameObject);

            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            // Semi-transparent dark background blocker
            Image bg = gameObject.AddComponent<Image>();
            bg.sprite = UIHelper.CreateWhiteSprite();
            bg.color = new Color(0.04f, 0.06f, 0.1f, 0.85f);
            bg.raycastTarget = true;

            // Modal center box
            GameObject box = new GameObject("CenterBox");
            box.transform.SetParent(transform, false);
            Image boxImg = box.AddComponent<Image>();
            boxImg.sprite = UIHelper.CreateWhiteSprite();
            boxImg.color = new Color(0.12f, 0.16f, 0.22f, 0.98f);

            RectTransform boxRt = box.GetComponent<RectTransform>();
            boxRt.sizeDelta = new Vector2(650f, 260f);
            boxRt.anchoredPosition = Vector2.zero;

            // Spinner square
            _spinnerIcon = new GameObject("SpinnerIcon");
            _spinnerIcon.transform.SetParent(box.transform, false);
            Image spinImg = _spinnerIcon.AddComponent<Image>();
            spinImg.sprite = UIHelper.CreateWhiteSprite();
            spinImg.color = new Color(0.3f, 0.7f, 1f, 1f);

            RectTransform spinRt = _spinnerIcon.GetComponent<RectTransform>();
            spinRt.sizeDelta = new Vector2(48f, 48f);
            spinRt.anchoredPosition = new Vector2(0f, 40f);

            // Spinner prompt text
            GameObject textObj = new GameObject("SpinnerText");
            textObj.transform.SetParent(box.transform, false);
            _spinnerText = textObj.AddComponent<Text>();
            _spinnerText.font = UIHelper.GetDefaultFont();
            _spinnerText.text = GameLayoutManager.TextAnalyzingDecisions;
            _spinnerText.fontSize = 28;
            _spinnerText.color = Color.white;
            _spinnerText.alignment = TextAnchor.MiddleCenter;

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.sizeDelta = new Vector2(600f, 60f);
            textRt.anchoredPosition = new Vector2(0f, -40f);
        }

        public void Show(string prompt = null)
        {
            if (!string.IsNullOrEmpty(prompt))
            {
                _spinnerText.text = prompt;
            }
            else
            {
                _spinnerText.text = GameLayoutManager.TextAnalyzingDecisions;
            }

            gameObject.SetActive(true);
            if (_spinCoroutine != null)
            {
                StopCoroutine(_spinCoroutine);
            }
            _spinCoroutine = StartCoroutine(SpinRoutine());
        }

        public void Hide()
        {
            if (_spinCoroutine != null)
            {
                StopCoroutine(_spinCoroutine);
                _spinCoroutine = null;
            }
            gameObject.SetActive(false);
        }

        private IEnumerator SpinRoutine()
        {
            while (true)
            {
                _spinnerIcon.transform.Rotate(0f, 0f, -360f * Time.deltaTime * 1.5f);
                yield return null;
            }
        }
    }
}

