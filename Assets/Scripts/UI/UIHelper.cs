using System;
using UnityEngine;
using UnityEngine.UI;

namespace DisasterSurvival.UI
{
    /// <summary>
    /// Utility methods for building clean UnityEngine.UI hierarchies in code without prefabs.
    /// Handles font fallbacks and pixel-art UI styling.
    /// </summary>
    public static class UIHelper
    {
        private static Font _cachedFont;

        public static Font GetDefaultFont()
        {
            if (_cachedFont != null) return _cachedFont;

            // Safe font loading order
            _cachedFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (_cachedFont == null)
            {
                _cachedFont = Resources.GetBuiltinResource<Font>("Arial.ttf");
            }
            if (_cachedFont == null)
            {
                _cachedFont = Font.CreateDynamicFontFromOSFont("Arial", 16);
            }
            return _cachedFont;
        }

        public static RectTransform EnsureRectTransform(GameObject obj)
        {
            if (obj == null) return null;
            RectTransform rt = obj.GetComponent<RectTransform>();
            if (rt == null)
            {
                rt = obj.AddComponent<RectTransform>();
            }
            return rt;
        }

        public static Sprite CreateWhiteSprite()
        {
            Texture2D tex = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            Color[] cols = new Color[] { Color.white, Color.white, Color.white, Color.white };
            tex.SetPixels(cols);
            tex.filterMode = FilterMode.Point;
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, 2, 2), new Vector2(0.5f, 0.5f));
        }

        public static Text CreateText(
            GameObject parent,
            string name,
            string content,
            int fontSize,
            Color color,
            TextAnchor alignment = TextAnchor.MiddleCenter
        )
        {
            GameObject textObj = new GameObject(name);
            textObj.transform.SetParent(parent.transform, false);

            Text text = textObj.AddComponent<Text>();
            text.font = GetDefaultFont();
            text.text = content;
            text.fontSize = fontSize;
            text.color = color;
            text.alignment = alignment;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Truncate;
            text.raycastTarget = false;

            RectTransform rt = textObj.GetComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            return text;
        }

        public static Image CreatePanel(
            GameObject parent,
            string name,
            Color color,
            Vector2 size,
            Vector2 anchoredPosition
        )
        {
            GameObject panelObj = new GameObject(name);
            panelObj.transform.SetParent(parent.transform, false);

            Image img = panelObj.AddComponent<Image>();
            img.sprite = CreateWhiteSprite();
            img.type = Image.Type.Simple;
            img.color = color;

            RectTransform rt = panelObj.GetComponent<RectTransform>();
            rt.sizeDelta = size;
            rt.anchoredPosition = anchoredPosition;

            return img;
        }

        public static Button CreateStyledButton(
            GameObject parent,
            string name,
            string label,
            Vector2 size,
            Color normalColor,
            Color textColor,
            int fontSize,
            Action onClick
        )
        {
            GameObject btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent.transform, false);

            Image img = btnObj.AddComponent<Image>();
            img.sprite = CreateWhiteSprite();
            img.type = Image.Type.Simple;
            img.color = normalColor;

            Button btn = btnObj.AddComponent<Button>();
            ColorBlock colors = btn.colors;
            colors.normalColor = normalColor;
            colors.highlightedColor = Color.Lerp(normalColor, Color.white, 0.25f);
            colors.pressedColor = normalColor * 0.7f;
            colors.disabledColor = new Color(0.3f, 0.3f, 0.3f, 0.6f);
            btn.colors = colors;

            RectTransform rt = btnObj.GetComponent<RectTransform>();
            rt.sizeDelta = size;

            // Button label
            Text text = CreateText(btnObj, "Text", label, fontSize, textColor, TextAnchor.MiddleCenter);

            if (onClick != null)
            {
                btn.onClick.AddListener(() => onClick.Invoke());
            }

            return btn;
        }
    }
}

