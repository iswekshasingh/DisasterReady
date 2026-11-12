using System;
using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Backend
{
    /// <summary>
    /// Manages client authentication state and JWT persistence.
    /// Stores the JWT token in PlayerPrefs for development with a TODO for secure keychain storage.
    /// </summary>
    public class AuthManager : MonoBehaviour
    {
        // TODO: Replace PlayerPrefs with secure OS keychain / encrypted storage before production release
        private const string PrefKeyJwt = "DISASTER_SURVIVAL_AUTH_JWT";
        private const string PrefKeyUsername = "DISASTER_SURVIVAL_AUTH_USER";

        private string _jwtToken = "";
        private string _currentUsername = "";

        public bool IsAuthenticated => !string.IsNullOrEmpty(_jwtToken);
        public string Token => _jwtToken;
        public string CurrentUsername => _currentUsername;

        private void Awake()
        {
            LoadSavedCredentials();
            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<AuthManager>();
        }

        private void LoadSavedCredentials()
        {
            _jwtToken = PlayerPrefs.GetString(PrefKeyJwt, "");
            _currentUsername = PlayerPrefs.GetString(PrefKeyUsername, "");
        }

        public void SaveSession(string token, string username)
        {
            _jwtToken = token ?? "";
            _currentUsername = username ?? "";

            PlayerPrefs.SetString(PrefKeyJwt, _jwtToken);
            PlayerPrefs.SetString(PrefKeyUsername, _currentUsername);
            PlayerPrefs.Save();
        }

        public void ClearSession()
        {
            _jwtToken = "";
            _currentUsername = "";
            PlayerPrefs.DeleteKey(PrefKeyJwt);
            PlayerPrefs.DeleteKey(PrefKeyUsername);
            PlayerPrefs.Save();
        }

        [Serializable]
        private class WebSessionData
        {
            public string token;
            public string username;
            public string baseUrl;
        }

        /// <summary>
        /// Invoked from React Web portal via unityInstance.SendMessage("[Managers]", "SetWebSession", json)
        /// Passes the authenticated user session directly in memory without exposing JWT in URLs.
        /// </summary>
        public void SetWebSession(string json)
        {
            if (string.IsNullOrEmpty(json)) return;

            try
            {
                WebSessionData data = JsonUtility.FromJson<WebSessionData>(json);
                if (data != null && !string.IsNullOrEmpty(data.token))
                {
                    if (!string.IsNullOrEmpty(data.baseUrl))
                    {
                        GameLayoutManager.baseUrl = data.baseUrl;
                    }

                    SaveSession(data.token, data.username);
                    Debug.Log($"[AuthManager] Web session received for user: {data.username}");

                    GameManager gm = GameLayoutManager.Get<GameManager>();
                    if (gm != null)
                    {
                        // In web mode, jump straight into the StarterScreen
                        gm.TransitionToState(GameState.StarterScreen);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AuthManager] Error parsing WebSession: {ex.Message}");
            }
        }
    }
}

