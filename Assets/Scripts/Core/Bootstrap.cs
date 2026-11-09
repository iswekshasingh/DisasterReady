using System;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using DisasterSurvival.Views;
using DisasterSurvival.Character;
using DisasterSurvival.UI;
using DisasterSurvival.Audio;
using DisasterSurvival.Backend;
using DisasterSurvival.Scenario;

namespace DisasterSurvival.Core
{
    /// <summary>
    /// Runtime bootstrapper that constructs the entire game from code upon pressing Play.
    /// Operates in completely empty scenes without requiring any prefabs or manual editor setup.
    /// </summary>
    public static class Bootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        public static void InitializeGame()
        {
            // Always clear the static registry on each play to avoid stale references
            // from previous play sessions (static fields survive domain reload in some configs)
            GameLayoutManager.ClearRegistry();

            // Guard against double-init: check if our Managers object already exists in the scene
            if (GameObject.Find("[Managers]") != null)
            {
                Debug.LogWarning("[Bootstrap] [Managers] already exists. Skipping duplicate initialization.");
                return;
            }

            Debug.Log("[Bootstrap] Initializing Disaster Survival 2D runtime architecture...");

            // 1. Setup Pixel-Perfect Camera
            SetupCamera();

            // 2. Setup EventSystem for Input & Clicks
            SetupEventSystem();

            // 3. Create Managers
            SetupManagers();

            // 4. Create World Environment & 2D Entities
            SetupWorld();

            // 5. Create UI Canvas & Screens
            SetupCanvas();

            Debug.Log("[Bootstrap] Initialization complete. All systems ready.");
        }

        private static void SetupCamera()
        {
            // Remove duplicate AudioListeners from any existing cameras
            AudioListener[] listeners = UnityEngine.Object.FindObjectsByType<AudioListener>(FindObjectsInactive.Exclude);
            for (int i = 1; i < listeners.Length; i++)
            {
                UnityEngine.Object.Destroy(listeners[i]);
            }

            Camera cam = Camera.main;
            if (cam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                cam = camObj.AddComponent<Camera>();
                camObj.tag = "MainCamera";
            }

            cam.orthographic = true;
            cam.orthographicSize = GameLayoutManager.OrthographicSize;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.12f, 0.15f, 0.2f, 1f);
            cam.transform.position = GameLayoutManager.CameraPosition;

            // Camera shake component
            if (cam.GetComponent<CameraShake>() == null)
            {
                cam.gameObject.AddComponent<CameraShake>();
            }

            // AudioListener on Camera
            if (cam.GetComponent<AudioListener>() == null)
            {
                cam.gameObject.AddComponent<AudioListener>();
            }
        }

        private static void SetupEventSystem()
        {
            if (EventSystem.current == null)
            {
                GameObject esObj = new GameObject("EventSystem");
                esObj.AddComponent<EventSystem>();

                // Dynamically prefer InputSystemUIInputModule when new input system is active,
                // otherwise fall back safely to StandaloneInputModule
                Type newModuleType = Type.GetType("UnityEngine.InputSystem.UI.InputSystemUIInputModule, Unity.InputSystem");
                if (newModuleType != null)
                {
                    esObj.AddComponent(newModuleType);
                }
                else
                {
                    esObj.AddComponent<StandaloneInputModule>();
                }
            }
        }

        private static void SetupManagers()
        {
            GameObject managersObj = new GameObject("[Managers]");

            managersObj.AddComponent<GameLayoutManager>();
            managersObj.AddComponent<AudioManager>();
            managersObj.AddComponent<ApiClient>();
            managersObj.AddComponent<AuthManager>();
            managersObj.AddComponent<ScenarioRunner>();
            managersObj.AddComponent<GameManager>();

            UnityEngine.Object.DontDestroyOnLoad(managersObj);
        }

        private static void SetupWorld()
        {
            GameObject worldRoot = new GameObject("[World]");

            // Background
            GameObject bgObj = new GameObject("BackgroundView");
            bgObj.transform.SetParent(worldRoot.transform);
            bgObj.AddComponent<SpriteRenderer>();
            bgObj.AddComponent<BackgroundView>();

            // Door
            GameObject doorObj = new GameObject("DoorView");
            doorObj.transform.SetParent(worldRoot.transform);
            doorObj.AddComponent<SpriteRenderer>();
            doorObj.AddComponent<DoorView>();

            // Table
            GameObject tableObj = new GameObject("TableView");
            tableObj.transform.SetParent(worldRoot.transform);
            tableObj.AddComponent<SpriteRenderer>();
            tableObj.AddComponent<TableView>();

            // Character
            GameObject charObj = new GameObject("Character");
            charObj.transform.SetParent(worldRoot.transform);
            charObj.AddComponent<SpriteRenderer>();
            charObj.AddComponent<CharacterController2D>();

            // Ceiling Debris Controller
            GameObject debrisObj = new GameObject("DebrisController");
            debrisObj.transform.SetParent(worldRoot.transform);
            debrisObj.AddComponent<DebrisController>();

            // Dust Effect Pool
            GameObject dustObj = new GameObject("DustEffect");
            dustObj.transform.SetParent(worldRoot.transform);
            dustObj.AddComponent<DustEffect>();
        }

        private static void SetupCanvas()
        {
            // Create the canvas with a high sort order so it renders on top
            GameObject canvasObj = new GameObject("Canvas");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;

            CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = GameLayoutManager.ReferenceResolution;
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            canvasObj.AddComponent<GraphicRaycaster>();

            // UI Elements under Canvas (order matters for layering: last = on top)
            // 1. Alert Border (fullscreen overlay, behind everything else)
            GameObject alertBorderObj = new GameObject("AlertBorderUI");
            alertBorderObj.transform.SetParent(canvasObj.transform, false);
            alertBorderObj.AddComponent<AlertBorderUI>();

            // 2. Banner UI (bottom banner)
            GameObject bannerObj = new GameObject("BannerUI");
            bannerObj.transform.SetParent(canvasObj.transform, false);
            bannerObj.AddComponent<BannerUI>();

            // 3. Decision UI (choice buttons above banner)
            GameObject decisionObj = new GameObject("DecisionUI");
            decisionObj.transform.SetParent(canvasObj.transform, false);
            decisionObj.AddComponent<DecisionUI>();

            // 4. Result UI (fullscreen modal)
            GameObject resultObj = new GameObject("ResultUI");
            resultObj.transform.SetParent(canvasObj.transform, false);
            resultObj.AddComponent<ResultUI>();

            // 5. Loading Spinner UI (fullscreen modal)
            GameObject spinnerObj = new GameObject("LoadingSpinnerUI");
            spinnerObj.transform.SetParent(canvasObj.transform, false);
            spinnerObj.AddComponent<LoadingSpinnerUI>();

            // 6. Auth UI (fullscreen modal, on top of everything)
            GameObject authObj = new GameObject("AuthUI");
            authObj.transform.SetParent(canvasObj.transform, false);
            authObj.AddComponent<AuthUI>();
        }
    }
}
