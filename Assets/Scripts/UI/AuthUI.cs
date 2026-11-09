using System;
using UnityEngine;
using UnityEngine.UI;
using DisasterSurvival.Core;
using DisasterSurvival.Backend;
using DisasterSurvival.Audio;

namespace DisasterSurvival.UI
{
    /// <summary>
    /// Code-only authentication view supporting Login, Registration, and Offline fallback.
    /// Operates without any scene assets or prefabs.
    /// </summary>
    public class AuthUI : MonoBehaviour
    {
        private Text _titleText;
        private InputField _usernameInput;
        private InputField _passwordInput;
        private Button _btnSubmit;
        private Text _btnSubmitText;
        private Text _btnSwitchModeText;
        private Text _errorText;

        private bool _isRegisterMode = false;
        private Action _onAuthSuccess;
        private Action _onPlayOffline;

        private void Awake()
        {
            GameLayoutManager.Register(this);
            try
            {
                BuildUI();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AuthUI] Build error: {ex}");
            }
            finally
            {
                gameObject.SetActive(false);
            }
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<AuthUI>();
        }

        private void BuildUI()
        {
            RectTransform rootRt = UIHelper.EnsureRectTransform(gameObject);
            rootRt.anchorMin = Vector2.zero;
            rootRt.anchorMax = Vector2.one;
            rootRt.offsetMin = Vector2.zero;
            rootRt.offsetMax = Vector2.zero;

            // Background
            Image bg = gameObject.AddComponent<Image>();
            bg.sprite = UIHelper.CreateWhiteSprite();
            bg.color = new Color(0.06f, 0.08f, 0.12f, 0.95f);

            // Center Panel
            GameObject panel = new GameObject("AuthCenterPanel");
            panel.transform.SetParent(transform, false);
            Image panelImg = panel.AddComponent<Image>();
            panelImg.sprite = UIHelper.CreateWhiteSprite();
            panelImg.color = new Color(0.12f, 0.16f, 0.22f, 0.98f);

            RectTransform panelRt = panel.GetComponent<RectTransform>();
            panelRt.sizeDelta = new Vector2(750f, 650f);
            panelRt.anchoredPosition = Vector2.zero;

            // Title
            _titleText = UIHelper.CreateText(panel, "Title", GameLayoutManager.TextAuthLoginTitle, 36, new Color(0.35f, 0.8f, 1f, 1f));
            RectTransform titleRt = _titleText.GetComponent<RectTransform>();
            titleRt.anchorMin = new Vector2(0f, 1f);
            titleRt.anchorMax = new Vector2(1f, 1f);
            titleRt.pivot = new Vector2(0.5f, 1f);
            titleRt.anchoredPosition = new Vector2(0f, -30f);
            titleRt.sizeDelta = new Vector2(0f, 50f);

            // Error Text
            _errorText = UIHelper.CreateText(panel, "ErrorText", "", 20, new Color(1f, 0.35f, 0.35f, 1f));
            RectTransform errRt = _errorText.GetComponent<RectTransform>();
            errRt.anchorMin = new Vector2(0f, 1f);
            errRt.anchorMax = new Vector2(1f, 1f);
            errRt.pivot = new Vector2(0.5f, 1f);
            errRt.anchoredPosition = new Vector2(0f, -85f);
            errRt.sizeDelta = new Vector2(650f, 40f);

            // Username Field
            _usernameInput = CreateInputField(panel, "UsernameInput", GameLayoutManager.TextAuthUsernamePlaceholder, new Vector2(0f, 100f), false);

            // Password Field
            _passwordInput = CreateInputField(panel, "PasswordInput", GameLayoutManager.TextAuthPasswordPlaceholder, new Vector2(0f, 20f), true);

            // Submit Button (Sign In / Register)
            _btnSubmit = UIHelper.CreateStyledButton(
                panel,
                "BtnSubmit",
                GameLayoutManager.TextAuthButtonLogin,
                new Vector2(550f, 65f),
                new Color(0.2f, 0.55f, 0.85f, 1f),
                Color.white,
                26,
                OnSubmitClicked
            );
            _btnSubmit.GetComponent<RectTransform>().anchoredPosition = new Vector2(0f, -70f);
            _btnSubmitText = _btnSubmit.GetComponentInChildren<Text>();

            // Mode switch toggle button
            Button btnSwitchMode = UIHelper.CreateStyledButton(
                panel,
                "BtnSwitchMode",
                GameLayoutManager.TextAuthSwitchToRegister,
                new Vector2(550f, 45f),
                new Color(0.18f, 0.22f, 0.3f, 1f),
                new Color(0.7f, 0.85f, 1f, 1f),
                20,
                ToggleMode
            );
            btnSwitchMode.GetComponent<RectTransform>().anchoredPosition = new Vector2(0f, -140f);
            _btnSwitchModeText = btnSwitchMode.GetComponentInChildren<Text>();

            // Offline bypass button
            Button btnOffline = UIHelper.CreateStyledButton(
                panel,
                "BtnOffline",
                GameLayoutManager.TextAuthPlayOffline,
                new Vector2(550f, 55f),
                new Color(0.28f, 0.32f, 0.4f, 1f),
                new Color(0.9f, 0.9f, 0.95f, 1f),
                22,
                () => _onPlayOffline?.Invoke()
            );
            btnOffline.GetComponent<RectTransform>().anchoredPosition = new Vector2(0f, -220f);
        }

        private InputField CreateInputField(GameObject parent, string name, string placeholderText, Vector2 anchoredPos, bool isPassword)
        {
            GameObject inputObj = new GameObject(name);
            inputObj.transform.SetParent(parent.transform, false);

            Image img = inputObj.AddComponent<Image>();
            img.sprite = UIHelper.CreateWhiteSprite();
            img.color = new Color(0.08f, 0.1f, 0.15f, 1f);

            InputField input = inputObj.AddComponent<InputField>();
            if (isPassword)
            {
                input.contentType = InputField.ContentType.Password;
            }

            RectTransform rt = inputObj.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(550f, 60f);
            rt.anchoredPosition = anchoredPos;

            // Text
            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(inputObj.transform, false);
            Text text = textObj.AddComponent<Text>();
            text.font = UIHelper.GetDefaultFont();
            text.fontSize = 24;
            text.color = Color.white;
            text.alignment = TextAnchor.MiddleLeft;

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = new Vector2(16f, 0f);
            textRt.offsetMax = new Vector2(-16f, 0f);
            input.textComponent = text;

            // Placeholder
            GameObject phObj = new GameObject("Placeholder");
            phObj.transform.SetParent(inputObj.transform, false);
            Text ph = phObj.AddComponent<Text>();
            ph.font = UIHelper.GetDefaultFont();
            ph.fontSize = 24;
            ph.color = new Color(0.55f, 0.6f, 0.7f, 0.5f);
            ph.alignment = TextAnchor.MiddleLeft;
            ph.text = placeholderText;

            RectTransform phRt = phObj.GetComponent<RectTransform>();
            phRt.anchorMin = Vector2.zero;
            phRt.anchorMax = Vector2.one;
            phRt.offsetMin = new Vector2(16f, 0f);
            phRt.offsetMax = new Vector2(-16f, 0f);
            input.placeholder = ph;

            return input;
        }

        public void Show(Action onAuthSuccess, Action onPlayOffline)
        {
            _onAuthSuccess = onAuthSuccess;
            _onPlayOffline = onPlayOffline;
            _errorText.text = "";
            gameObject.SetActive(true);
        }

        public void Hide()
        {
            gameObject.SetActive(false);
        }

        private void ToggleMode()
        {
            _isRegisterMode = !_isRegisterMode;
            _errorText.text = "";

            if (_isRegisterMode)
            {
                _titleText.text = GameLayoutManager.TextAuthRegisterTitle;
                _btnSubmitText.text = GameLayoutManager.TextAuthButtonRegister;
                _btnSwitchModeText.text = GameLayoutManager.TextAuthSwitchToLogin;
            }
            else
            {
                _titleText.text = GameLayoutManager.TextAuthLoginTitle;
                _btnSubmitText.text = GameLayoutManager.TextAuthButtonLogin;
                _btnSwitchModeText.text = GameLayoutManager.TextAuthSwitchToRegister;
            }
        }

        private void OnSubmitClicked()
        {
            string username = _usernameInput.text.Trim();
            string password = _passwordInput.text.Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                _errorText.text = "Please enter both username and password.";
                return;
            }

            _errorText.text = "Connecting...";
            _btnSubmit.interactable = false;

            ApiClient api = GameLayoutManager.Get<ApiClient>();
            if (api == null)
            {
                _errorText.text = "API Client not available.";
                _btnSubmit.interactable = true;
                return;
            }

            if (_isRegisterMode)
            {
                RegisterRequest req = new RegisterRequest { username = username, password = password };
                api.Register(req, OnAuthResponse, OnAuthFailed);
            }
            else
            {
                LoginRequest req = new LoginRequest { username = username, password = password };
                api.Login(req, OnAuthResponse, OnAuthFailed);
            }
        }

        private void OnAuthResponse(AuthResponse resp)
        {
            _btnSubmit.interactable = true;
            string token = resp != null ? resp.GetToken() : "";
            if (string.IsNullOrEmpty(token))
            {
                _errorText.text = "Authentication failed: No token returned.";
                return;
            }

            AuthManager auth = GameLayoutManager.Get<AuthManager>();
            if (auth != null)
            {
                string uname = resp.user != null ? resp.user.username : _usernameInput.text.Trim();
                auth.SaveSession(token, uname);
            }

            Hide();
            _onAuthSuccess?.Invoke();
        }

        private void OnAuthFailed(string error)
        {
            _btnSubmit.interactable = true;
            _errorText.text = $"Auth error: {error}";
        }
    }
}
