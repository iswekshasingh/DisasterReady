
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

        private UnityWebRequest CreateRequest(
            string endpoint,
            string method,
            string jsonBody = null,
            int timeoutSeconds = 15)
        {
            string url =
                $"{GameLayoutManager.baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";

            UnityWebRequest request = new UnityWebRequest(url, method);

            if (!string.IsNullOrEmpty(jsonBody))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.SetRequestHeader("Content-Type", "application/json");
            }

            request.downloadHandler = new DownloadHandlerBuffer();
            request.timeout = timeoutSeconds;

            AuthManager auth = GameLayoutManager.Get<AuthManager>();

            if (auth != null && auth.IsAuthenticated)
            {
                request.SetRequestHeader(
                    "Authorization",
                    $"Bearer {auth.Token}");
            }

            return request;
        }

        private IEnumerator SendRequest<T>(
            UnityWebRequest request,
            string endpoint,
            Action<T> onSuccess,
            Action<string> onFailure)
        {
            using (request)
            {
                bool hasAuthToken = request.GetRequestHeader("Authorization") != null;
                Debug.Log(
                    $"[ApiClient] Sending {request.method} request to: {request.url} | " +
                    $"Auth token present: {hasAuthToken} | Timeout: {request.timeout}s");

                yield return request.SendWebRequest();

                string rawJson = request.downloadHandler != null
                    ? request.downloadHandler.text
                    : "";

                long statusCode = request.responseCode;

                Debug.Log(
                    $"[ApiClient] Response ({request.method} {request.url}) " +
                    $"[Status: {statusCode}]:\n{rawJson}");

                if (statusCode == 401 || statusCode == 403)
                {
                    AuthManager auth = GameLayoutManager.Get<AuthManager>();

                    if (auth != null)
                        auth.ClearSession();

                    OnUnauthorized?.Invoke();

                    onFailure?.Invoke(
                        "Session expired. Please sign in again.");

                    yield break;
                }

                if (request.result != UnityWebRequest.Result.Success)
                {
                    string errorMsg = !string.IsNullOrEmpty(rawJson)
                        ? rawJson
                        : request.error;

                    Debug.LogError(
                        $"[ApiClient] Request Failed ({request.method} {request.url}): " +
                        $"Result={request.result}, Status={statusCode}, Error={request.error}, Details={rawJson}");

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
                    Debug.LogError(
                        $"[ApiClient] Deserialization Error ({request.method} {request.url}): " +
                        $"{ex.Message}\nRaw: {rawJson}");

                    onFailure?.Invoke($"Data parse error: {ex.Message}");
                }
            }
        }

        #endregion

        #region Authentication Endpoints

        public void Register(
            RegisterRequest req,
            Action<AuthResponse> onSuccess,
            Action<string> onFailure)
        {
            string json = JsonConvert.SerializeObject(req);

            UnityWebRequest uwr =
                CreateRequest("/api/auth/register", "POST", json);

            StartCoroutine(
                SendRequest<AuthResponse>(
                    uwr, "/api/auth/register", onSuccess, onFailure));
        }

        public void Login(
            LoginRequest req,
            Action<AuthResponse> onSuccess,
            Action<string> onFailure)
        {
            string json = JsonConvert.SerializeObject(req);

            UnityWebRequest uwr =
                CreateRequest("/api/auth/login", "POST", json);

            StartCoroutine(
                SendRequest<AuthResponse>(
                    uwr, "/api/auth/login", onSuccess, onFailure));
        }

        public void GetMe(
            Action<UserDto> onSuccess,
            Action<string> onFailure)
        {
            string endpoint = "/api/auth/me";

            UnityWebRequest uwr = CreateRequest(endpoint, "GET");

            StartCoroutine(
                SendRequest<MeResponse>(
                    uwr,
                    endpoint,
                    response =>
                    {
                        if (response != null &&
                            response.success &&
                            response.user != null)
                        {
                            onSuccess?.Invoke(response.user);
                        }
                        else
                        {
                            onFailure?.Invoke("Invalid profile response.");
                        }
                    },
                    onFailure));
        }

        #endregion

        #region Scenario Endpoints

        public void GetScenarios(
            Action<List<ScenarioItem>> onSuccess,
            Action<string> onFailure)
        {
            string endpoint = "/api/scenarios";

            UnityWebRequest uwr = CreateRequest(endpoint, "GET");

            StartCoroutine(
                SendRequest<ScenariosResponse>(
                    uwr,
                    endpoint,
                    response =>
                    {
                        if (response != null &&
                            response.success &&
                            response.scenarios != null)
                        {
                            onSuccess?.Invoke(response.scenarios);
                        }
                        else
                        {
                            onFailure?.Invoke("Invalid scenarios response.");
                        }
                    },
                    onFailure));
        }

        public void GetScenarioDetail(
            string scenarioId,
            Action<ScenarioDetail> onSuccess,
            Action<string> onFailure)
        {
            string endpoint = $"/api/scenarios/{scenarioId}";

            UnityWebRequest uwr = CreateRequest(endpoint, "GET");

            StartCoroutine(
                SendRequest<ScenarioDetailResponse>(
                    uwr,
                    endpoint,
                    response =>
                    {
                        if (response != null &&
                            response.success &&
                            response.scenario != null)
                        {
                            onSuccess?.Invoke(response.scenario);
                        }
                        else
                        {
                            onFailure?.Invoke(
                                "Invalid scenario detail response.");
                        }
                    },
                    onFailure));
        }

        #endregion

        #region Attempt Submission

        public void SubmitAttempt(
            AttemptSubmissionRequest req,
            Action<AttemptResultResponse> onSuccess,
            Action<string> onFailure)
        {
            string json = JsonConvert.SerializeObject(req);

            Debug.Log(
                $"[ApiClient] Submitting attempt payload:\n{json}");

            UnityWebRequest uwr = CreateRequest(
                "/api/attempts",
                "POST",
                json,
                GameLayoutManager.SubmitTimeoutSeconds);

            StartCoroutine(
                SendRequest<AttemptSubmissionResponse>(
                    uwr,
                    "/api/attempts",
                    response =>
                    {
                        if (response != null &&
                            response.success &&
                            response.attempt != null)
                        {
                            onSuccess?.Invoke(response.attempt);
                        }
                        else
                        {
                            onFailure?.Invoke(
                                "Invalid attempt response.");
                        }
                    },
                    onFailure));
        }

        #endregion

        #region Leaderboard

        public void GetLeaderboard(
            Action<List<LeaderboardEntry>> onSuccess,
            Action<string> onFailure)
        {
            string endpoint = "/api/leaderboard";

            UnityWebRequest uwr = CreateRequest(endpoint, "GET");

            StartCoroutine(
                SendRequest<LeaderboardResponse>(
                    uwr,
                    endpoint,
                    response =>
                    {
                        if (response != null &&
                            response.success &&
                            response.leaderboard != null)
                        {
                            onSuccess?.Invoke(response.leaderboard);
                        }
                        else
                        {
                            onFailure?.Invoke(
                                "Invalid leaderboard response.");
                        }
                    },
                    onFailure));
        }

        #endregion
    }
}
