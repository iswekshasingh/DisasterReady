using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;
using DisasterSurvival.Core;

namespace DisasterSurvival.Backend
{
    /// <summary>
    /// Communicates with the Node.js/Express backend API.
    /// Injects JWT Bearer tokens, logs raw JSON to the Console, enforces 30s timeout on AI submits,
    /// and handles 401 re-authentication flows.
    /// </summary>
    public class ApiClient : MonoBehaviour
    {
        public event Action OnUnauthorized;

        private void Awake()
        {
            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<ApiClient>();
        }

        #region Helper Request Methods
        private UnityWebRequest CreateRequest(string endpoint, string method, string jsonBody = null, int timeoutSeconds = 15)
        {
            string url = $"{GameLayoutManager.baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            UnityWebRequest request = new UnityWebRequest(url, method);

            if (!string.IsNullOrEmpty(jsonBody))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.SetRequestHeader("Content-Type", "application/json");
            }

            request.downloadHandler = new DownloadHandlerBuffer();
            request.timeout = timeoutSeconds;

            // Inject JWT Bearer Token if available
            AuthManager auth = GameLayoutManager.Get<AuthManager>();
            if (auth != null && auth.IsAuthenticated)
            {
                request.SetRequestHeader("Authorization", $"Bearer {auth.Token}");
            }

            return request;
        }

        private IEnumerator SendRequest<T>(UnityWebRequest request, string endpoint, Action<T> onSuccess, Action<string> onFailure)
        {
            using (request)
            {
                yield return request.SendWebRequest();

                string rawJson = request.downloadHandler != null ? request.downloadHandler.text : "";
                long statusCode = request.responseCode;

                Debug.Log($"[ApiClient] Response ({endpoint}) [Status: {statusCode}]:\n{rawJson}");

                if (statusCode == 401)
                {
                    Debug.LogWarning($"[ApiClient] 401 Unauthorized encountered on {endpoint}. Clearing session.");
                    AuthManager auth = GameLayoutManager.Get<AuthManager>();
                    if (auth != null) auth.ClearSession();
                    OnUnauthorized?.Invoke();
                    onFailure?.Invoke("Session expired. Please sign in again.");
                    yield break;
                }

                if (request.result != UnityWebRequest.Result.Success)
                {
                    string errorMsg = !string.IsNullOrEmpty(rawJson) ? rawJson : request.error;
                    Debug.LogError($"[ApiClient] Request Failed ({endpoint}): {errorMsg}");
                    onFailure?.Invoke(errorMsg);
                    yield break;
                }

                try
                {
                    T result = JsonConvert.DeserializeObject<T>(rawJson);
                    onSuccess?.Invoke(result);
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[ApiClient] Deserialization Error on ({endpoint}): {ex.Message}\nRaw: {rawJson}");
                    onFailure?.Invoke($"Data parse error: {ex.Message}");
                }
            }
        }
        #endregion

        #region Authentication Endpoints
        public void Register(RegisterRequest req, Action<AuthResponse> onSuccess, Action<string> onFailure)
        {
            string json = JsonConvert.SerializeObject(req);
            UnityWebRequest uwr = CreateRequest("/api/auth/register", "POST", json);
            StartCoroutine(SendRequest<AuthResponse>(uwr, "/api/auth/register", onSuccess, onFailure));
        }

        public void Login(LoginRequest req, Action<AuthResponse> onSuccess, Action<string> onFailure)
        {
            string json = JsonConvert.SerializeObject(req);
            UnityWebRequest uwr = CreateRequest("/api/auth/login", "POST", json);
            StartCoroutine(SendRequest<AuthResponse>(uwr, "/api/auth/login", onSuccess, onFailure));
        }

        public void GetMe(Action<UserDto> onSuccess, Action<string> onFailure)
        {
            UnityWebRequest uwr = CreateRequest("/api/auth/me", "GET");
            StartCoroutine(SendRequest<UserDto>(uwr, "/api/auth/me", onSuccess, onFailure));
        }
        #endregion

        #region Scenario Endpoints
        public void GetScenarios(Action<List<ScenarioItem>> onSuccess, Action<string> onFailure)
        {
            UnityWebRequest uwr = CreateRequest("/api/scenarios", "GET");
            StartCoroutine(SendRequest<List<ScenarioItem>>(uwr, "/api/scenarios", onSuccess, err =>
            {
                // Fallback attempt: some APIs wrap list in { scenarios: [...] }
                StartCoroutine(SendScenariosWrapped(err, onSuccess, onFailure));
            }));
        }

        private IEnumerator SendScenariosWrapped(string originalError, Action<List<ScenarioItem>> onSuccess, Action<string> onFailure)
        {
            UnityWebRequest uwr = CreateRequest("/api/scenarios", "GET");
            using (uwr)
            {
                yield return uwr.SendWebRequest();
                string raw = uwr.downloadHandler != null ? uwr.downloadHandler.text : "";
                try
                {
                    var dict = JsonConvert.DeserializeObject<Dictionary<string, List<ScenarioItem>>>(raw);
                    if (dict != null && dict.TryGetValue("scenarios", out var list))
                    {
                        onSuccess?.Invoke(list);
                        yield break;
                    }
                }
                catch { }

                onFailure?.Invoke(originalError);
            }
        }

        public void GetScenarioDetail(string scenarioId, Action<ScenarioDetail> onSuccess, Action<string> onFailure)
        {
            string endpoint = $"/api/scenarios/{scenarioId}";
            UnityWebRequest uwr = CreateRequest(endpoint, "GET");
            StartCoroutine(SendRequest<ScenarioDetail>(uwr, endpoint, onSuccess, onFailure));
        }
        #endregion

        #region Attempt Submission
        public void SubmitAttempt(AttemptSubmissionRequest req, Action<AttemptResultResponse> onSuccess, Action<string> onFailure)
        {
            string json = JsonConvert.SerializeObject(req);
            Debug.Log($"[ApiClient] Submitting attempt payload:\n{json}");

            // 30 second timeout enforced for AI analysis
            UnityWebRequest uwr = CreateRequest("/api/attempts", "POST", json, GameLayoutManager.SubmitTimeoutSeconds);
            StartCoroutine(SendRequest<AttemptResultResponse>(uwr, "/api/attempts", onSuccess, onFailure));
        }

        public void GetLeaderboard(Action<List<LeaderboardEntry>> onSuccess, Action<string> onFailure)
        {
            UnityWebRequest uwr = CreateRequest("/api/leaderboard", "GET");
            StartCoroutine(SendRequest<List<LeaderboardEntry>>(uwr, "/api/leaderboard", onSuccess, err =>
            {
                // Fallback in case wrapped in { leaderboard: [...] }
                StartCoroutine(SendLeaderboardWrapped(err, onSuccess, onFailure));
            }));
        }

        private IEnumerator SendLeaderboardWrapped(string originalError, Action<List<LeaderboardEntry>> onSuccess, Action<string> onFailure)
        {
            UnityWebRequest uwr = CreateRequest("/api/leaderboard", "GET");
            using (uwr)
            {
                yield return uwr.SendWebRequest();
                string raw = uwr.downloadHandler != null ? uwr.downloadHandler.text : "";
                try
                {
                    var dict = JsonConvert.DeserializeObject<Dictionary<string, List<LeaderboardEntry>>>(raw);
                    if (dict != null && dict.TryGetValue("leaderboard", out var list))
                    {
                        onSuccess?.Invoke(list);
                        yield break;
                    }
                }
                catch { }

                onFailure?.Invoke(originalError);
            }
        }
        #endregion
    }
}

