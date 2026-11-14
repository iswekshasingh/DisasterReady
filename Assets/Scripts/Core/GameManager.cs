using System;
using System.Collections.Generic;
using UnityEngine;
using DisasterSurvival.Audio;
using DisasterSurvival.Backend;
using DisasterSurvival.Scenario;
using DisasterSurvival.UI;

namespace DisasterSurvival.Core
{
    public enum GameState
    {
        Login,
        StarterScreen,
        Menu,
        Simulation,
        Submitting,
        Results
    }

    /// <summary>
    /// Master state machine coordinating application state transitions between
    /// Login, Main Menu / Scenario selection, Simulation Beats, Submitting, and Results.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        private GameState _currentState = GameState.Login;
        public GameState CurrentState => _currentState;

#if UNITY_WEBGL && !UNITY_EDITOR
        [System.Runtime.InteropServices.DllImport("__Internal")]
        private static extern void NotifyAuthExpiredToWeb();
#endif

        private void Awake()
        {
            GameLayoutManager.Register(this);
        }

        private void Start()
        {
            ApiClient api = GameLayoutManager.Get<ApiClient>();
            if (api != null)
            {
                api.OnUnauthorized += HandleUnauthorized;
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            if (GameLayoutManager.useBackend)
            {
                // Never block the game behind session injection. The web page sends the
                // token as soon as Unity is ready; the account is attached asynchronously.
                AuthManager auth = GameLayoutManager.Get<AuthManager>();
                if (auth != null && auth.HasWebSession)
                    OnWebSessionReceived();
                else
                    TransitionToState(GameState.StarterScreen);
                return;
            }
#endif
            InitializeGameFlow();
        }

        public void OnWebSessionReceived()
        {
            LoadingSpinnerUI spinner = GameLayoutManager.Get<LoadingSpinnerUI>();
            if (spinner != null) spinner.Hide();
            TransitionToState(GameState.StarterScreen);
        }

        private void OnDestroy()
        {
            ApiClient api = GameLayoutManager.Get<ApiClient>();
            if (api != null)
            {
                api.OnUnauthorized -= HandleUnauthorized;
            }
            GameLayoutManager.Unregister<GameManager>();
        }

        public void InitializeGameFlow()
        {
            if (GameLayoutManager.useBackend)
            {
                AuthManager auth = GameLayoutManager.Get<AuthManager>();
                if (auth != null && auth.IsAuthenticated)
                {
                    TransitionToState(GameState.StarterScreen);
                }
                else
                {
                    TransitionToState(GameState.Login);
                }
            }
            else
            {
                // In offline mode, present the Starter Screen before starting any simulation
                TransitionToState(GameState.StarterScreen);
            }
        }

        public void TransitionToState(GameState newState)
        {
            _currentState = newState;
            Debug.Log($"[GameManager] Transitioning to state: {_currentState}");

            switch (_currentState)
            {
                case GameState.Login:
                    ShowLogin();
                    break;
                case GameState.StarterScreen:
                    ShowStarterScreen();
                    break;
                case GameState.Menu:
                    FetchAndStartBackendScenario();
                    break;
                case GameState.Simulation:
                    StartSimulation();
                    break;
            }
        }

        private void ShowLogin()
        {
            AuthUI authUI = GameLayoutManager.Get<AuthUI>();
            if (authUI != null)
            {
                authUI.Show(
                    onAuthSuccess: () => TransitionToState(GameState.StarterScreen),
                    onPlayOffline: () =>
                    {
                        GameLayoutManager.useBackend = false;
                        authUI.Hide();
                        TransitionToState(GameState.StarterScreen);
                    }
                );
            }
        }

        public void ShowStarterScreen()
        {
            StarterScreenUI starter = GameLayoutManager.Get<StarterScreenUI>();
            if (starter != null)
            {
                starter.Show((simIndex) =>
                {
                    starter.Hide();
                    _currentState = GameState.Simulation;
                    ScenarioRunner runner = GameLayoutManager.Get<ScenarioRunner>();
                    if (runner != null)
                    {
                        runner.StartOfflineSimulation(simIndex);
                    }
                });
            }
            else
            {
                TransitionToState(GameState.Simulation);
            }
        }

        public void ReturnToStarterScreen()
        {
            ScenarioRunner runner = GameLayoutManager.Get<ScenarioRunner>();
            if (runner != null)
            {
                runner.StopCurrentSimulation();
            }

            TransitionToState(GameState.StarterScreen);
        }

        // Called synchronously by the host page before Unity quits on route changes.
        public void StopAudioForPageExit()
        {
            ScenarioRunner runner = GameLayoutManager.Get<ScenarioRunner>();
            if (runner != null) runner.StopCurrentSimulation();
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null) audio.StopAllAudio();
            AudioListener.pause = true;
        }

        private void FetchAndStartBackendScenario()
        {
            LoadingSpinnerUI spinner = GameLayoutManager.Get<LoadingSpinnerUI>();
            if (spinner != null) spinner.Show("Fetching Disaster Scenarios...");

            ApiClient api = GameLayoutManager.Get<ApiClient>();
            if (api != null)
            {
                api.GetScenarios(
                    scenarios =>
                    {
                        if (scenarios != null && scenarios.Count > 0)
                        {
                            string firstScenarioId = scenarios[0].GetId();
                            LoadScenarioDetails(firstScenarioId);
                        }
                        else
                        {
                            if (spinner != null) spinner.Hide();
                            // Fallback to offline earthquake
                            TransitionToState(GameState.Simulation);
                        }
                    },
                    err =>
                    {
                        if (spinner != null) spinner.Hide();
                        Debug.LogWarning($"[GameManager] Could not load backend scenarios: {err}. Falling back to local offline scenario.");
                        TransitionToState(GameState.Simulation);
                    }
                );
            }
            else
            {
                TransitionToState(GameState.Simulation);
            }
        }

        private void LoadScenarioDetails(string scenarioId)
        {
            ApiClient api = GameLayoutManager.Get<ApiClient>();
            if (api != null)
            {
                api.GetScenarioDetail(
                    scenarioId,
                    detail =>
                    {
                        LoadingSpinnerUI spinner = GameLayoutManager.Get<LoadingSpinnerUI>();
                        if (spinner != null) spinner.Hide();

                        ScenarioRunner runner = GameLayoutManager.Get<ScenarioRunner>();
                        if (runner != null)
                        {
                            _currentState = GameState.Simulation;
                            runner.StartBackendSimulation(detail);
                        }
                    },
                    err =>
                    {
                        LoadingSpinnerUI spinner = GameLayoutManager.Get<LoadingSpinnerUI>();
                        if (spinner != null) spinner.Hide();
                        Debug.LogWarning($"[GameManager] Could not load detail for {scenarioId}: {err}. Falling back to offline.");
                        TransitionToState(GameState.Simulation);
                    }
                );
            }
        }

        private void StartSimulation()
        {
            ScenarioRunner runner = GameLayoutManager.Get<ScenarioRunner>();
            if (runner != null)
            {
                runner.StartOfflineSimulation();
            }
        }

        private void HandleUnauthorized()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                NotifyAuthExpiredToWeb();
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[GameManager] Could not notify the portal about an expired session: {ex.Message}");
            }
#else
            TransitionToState(GameState.Login);
#endif
        }
    }
}

