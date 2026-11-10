using System;
using System.Collections.Generic;
using UnityEngine;

namespace DisasterSurvival.Core
{
    /// <summary>
    /// Central single source of truth for the entire game.
    /// Contains Layout config, Timing config, Text config, the ComponentRegistry, and Backend flags.
    /// No component may hardcode a position, size, time or string; they all read from this manager.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class GameLayoutManager : MonoBehaviour
    {
        #region Component Registry
        private static readonly Dictionary<Type, object> _registry = new Dictionary<Type, object>();

        /// <summary>
        /// Registers a component instance into the global registry.
        /// </summary>
        public static void Register<T>(T instance) where T : class
        {
            if (instance == null) return;
            _registry[typeof(T)] = instance;
        }

        /// <summary>
        /// Unregisters a component instance from the global registry.
        /// </summary>
        public static void Unregister<T>() where T : class
        {
            _registry.Remove(typeof(T));
        }

        /// <summary>
        /// Retrieves a registered component instance from the global registry.
        /// </summary>
        public static T Get<T>() where T : class
        {
            if (_registry.TryGetValue(typeof(T), out object instance))
            {
                return instance as T;
            }
            return null;
        }

        /// <summary>
        /// Clears all registered components (useful on scene reset).
        /// </summary>
        public static void ClearRegistry()
        {
            _registry.Clear();
        }
        #endregion

        #region Backend Flags & Settings
        [Header("Backend Integration Settings")]
        [Tooltip("When true, authenticates and fetches scenarios/submits attempts to the backend API. When false, runs completely offline.")]
        [SerializeField] private bool _useBackend = false;

        [Tooltip("The base URL of the Node.js/Express API server.")]
        [SerializeField] private string _baseUrl = "http://localhost:4000";

        public static bool useBackend = false;
        public static string baseUrl = "http://localhost:4000";
        #endregion

        #region 1. Layout Configuration
        [Header("Camera & Display")]
        // Reference resolution for UI CanvasScaler and orthographic calculations
        public static readonly Vector2 ReferenceResolution = new Vector2(1920f, 1080f);

        // Pixel-art Pixels Per Unit. Changing this rescales world units consistently.
        public static readonly float PixelsPerUnit = 32f;

        // Camera position in world space
        public static readonly Vector3 CameraPosition = new Vector3(0f, 0f, -10f);

        // Computed pixel-perfect orthographic size: (1080 / 32) / 2 = 16.875
        public static float OrthographicSize => ReferenceResolution.y / (2f * PixelsPerUnit);

        // Screen world dimensions derived from reference resolution and PPU
        public static float WorldWidth => ReferenceResolution.x / PixelsPerUnit;   // 60 world units
        public static float WorldHeight => ReferenceResolution.y / PixelsPerUnit; // 33.75 world units

        [Header("World Coordinates & Element Sizes")]
        // Floor line Y coordinate in world space. Calibrated to align with chair feet and baseboard floor.
        public static readonly float FloorLineY = -12.0f;

        // Background size (covers full viewport) and world position
        public static readonly Vector2 BackgroundSize = new Vector2(60f, 33.75f);
        public static readonly Vector3 BackgroundPosition = new Vector3(0f, 0f, 0f);

        // Character standing and hiding target heights in world units
        public static readonly float CharacterStandingHeight = 8.0f;
        public static readonly float CharacterHidingHeight = 3.3f;

        // Character world dimensions (approx 3.2x8 world units -> matches pixel art proportions)
        public static readonly Vector2 CharacterSize = new Vector2(3.2f, 8.0f);
        // Start position on floor: aligned with chair feet (feet at Y = -12.0f, center at Y = -8.0f)
        public static readonly Vector3 CharacterStartPosition = new Vector3(-4f, -8.0f, 0f);
        // Hiding position under the table: sheltered between table legs (feet at Y = -12.0f, center at Y = -10.35f)
        public static readonly Vector3 CharacterHidePosition = new Vector3(4.5f, -10.35f, 0f);
        // Run target position: reaching towards the exit door on the far right along the floor line
        public static readonly Vector3 CharacterRunTarget = new Vector3(17.5f, -8.0f, 0f);

        // Table world dimensions (approx 11.5x5.625 world units -> matches pixel art table)
        public static readonly Vector2 TableSize = new Vector2(11.5f, 5.625f);
        // Table placement on floor: legs rest on floor at Y = -12.0f, tabletop surface at Y = -6.375f
        public static readonly Vector3 TablePosition = new Vector3(4.5f, -9.1875f, 0f);

        // Door world dimensions (approx 5x9 world units -> 160x288 pixels at 32 PPU)
        public static readonly Vector2 DoorSize = new Vector2(5f, 9f);
        // Door position at the right side of the room resting on floor
        public static readonly Vector3 DoorPosition = new Vector3(21f, -7.5f, 0f);

        // Debris 1 (the rock landing directly on top of the sturdy table):
        // 2.5x scale: 2.12 * 2.5 = 5.3, 1.45 * 2.5 = 3.625
        public static readonly Vector2 Debris1Size = new Vector2(5.3f, 3.625f);
        public static readonly Vector3 Debris1StartPosition = new Vector3(4.5f, 18f, 0f);
        // Lands on tabletop: table top is at Y = -6.375f, rock height is 3.625f -> center = -4.5625f
        public static readonly Vector3 Debris1LandingPosition = new Vector3(4.5f, -4.5625f, 0f);

        // Debris 2 (the rock landing on the floor in the character's run corridor to the door):
        // 2.5x scale: same dimensions
        public static readonly Vector2 Debris2Size = new Vector2(5.3f, 3.625f);
        public static readonly Vector3 Debris2StartPosition = new Vector3(13.5f, 18f, 0f);
        // Lands on floor: floor line is Y = -12.0f, rock height is 3.625f -> center = -10.1875f
        public static readonly Vector3 Debris2LandingPosition = new Vector3(13.5f, -10.1875f, 0f);

        [Header("Sorting Orders (Default Sorting Layer)")]
        public static readonly int SortingOrderBackground = 0;
        public static readonly int SortingOrderDoor = 1;
        public static readonly int SortingOrderDustBack = 2;
        public static readonly int SortingOrderCharacter = 5;
        public static readonly int SortingOrderTable = 10; // Table is in front of character when hiding
        public static readonly int SortingOrderDebris = 15;
        public static readonly int SortingOrderDustFront = 20;

        [Header("UI Canvas Rects (Reference 1920x1080)")]
        // Bottom dialogue/alert banner
        public static readonly Vector2 BannerAnchoredPosition = new Vector2(0f, 30f);
        public static readonly Vector2 BannerSize = new Vector2(1760f, 190f);

        // Decision UI button area (reverted back to 260)
        public static readonly Vector2 DecisionPanelAnchoredPosition = new Vector2(0f, 260f);
        public static readonly Vector2 DecisionButtonSize = new Vector2(760f, 90f);
        public static readonly float DecisionButtonSpacing = 30f;

        // Results panel modal rect
        public static readonly Vector2 ResultPanelSize = new Vector2(1100f, 760f);

        // Alert border thickness (pixels inset on all 4 borders)
        public static readonly float AlertBorderThickness = 18f;
        #endregion

        #region 2. Timing Configuration
        [Header("Timing (Seconds)")]
        // Delay before showing interactive choice buttons after alert begins typing
        public static readonly float AlertDelayBeforeButtons = 2.0f;

        // Smooth movement durations
        public static readonly float WalkToTableDuration = 1.3f;
        public static readonly float RunDuration = 1.6f;

        // Screen shake duration and intensity
        public static readonly float ShakeDuration = 2.5f;
        public static readonly float ShakeStrength = 0.4f;

        // Ceiling debris fall duration
        public static readonly float DebrisFallDuration = 0.55f;

        // Outcome message and animation pause duration before next beat
        public static readonly float OutcomeDisplayDuration = 3.2f;

        // Typewriter speed in seconds per character
        public static readonly float TypewriterSpeed = 0.025f;

        // Subtle idle bob parameters for character
        public static readonly float IdleBobSpeed = 2.5f;
        public static readonly float IdleBobAmount = 0.1f;

        // Emergency alert border flash rate
        public static readonly float AlertFlashInterval = 0.22f;

        // Backend submit timeout
        public static readonly int SubmitTimeoutSeconds = 30;
        #endregion

        #region 3. Text Configuration
        [Header("Game Texts & Localized Strings")]
        // Beat 1: Alert & Initial Warning
        public static readonly string TextAlertGovernment = "GOVERNMENT ALERT: An earthquake is expected very soon. Please find cover immediately!";
        public static readonly string EQ_Q1_Id = "EQ_Q1";
        public static readonly string EQ_Q1_Prompt = "An earthquake warning has sounded! What will you do?";
        public static readonly string EQ_Q1_OptionA_Id = "A";
        public static readonly string EQ_Q1_OptionA_Label = "Hide Under the Table";
        public static readonly string EQ_Q1_OptionB_Id = "B";
        public static readonly string EQ_Q1_OptionB_Label = "Run Outside the Building";
        public static readonly string EQ_Q1_Safe_Message = "You're safe! Taking cover under a sturdy table protects you from falling debris. Drop, Cover and Hold On!";
        public static readonly string EQ_Q1_Harm_Message = "Running during an earthquake is dangerous. Falling debris causes most injuries near exits and stairs. Drop, Cover and Hold On instead.";

        // Beat 2: Shaking In Progress
        public static readonly string EQ_Q2_Id = "EQ_Q2";
        public static readonly string EQ_Q2_Prompt = "Violent ground shaking begins! Heavy ceiling tiles start cracking above!";
        public static readonly string EQ_Q2_OptionA_Id = "A";
        public static readonly string EQ_Q2_OptionA_Label = "Stay under cover until the shaking stops";
        public static readonly string EQ_Q2_OptionB_Id = "B";
        public static readonly string EQ_Q2_OptionB_Label = "Crawl out and run for the door";
        public static readonly string EQ_Q2_Safe_Message = "Protected! Concrete debris slammed down right where you would have run. The sturdy table shielded you!";
        public static readonly string EQ_Q2_Harm_Message = "Injured! Leaving cover during shaking exposes you to heavy falling ceiling materials. Always stay put until shaking stops.";

        // Beat 3: Post-Shaking Evacuation
        public static readonly string EQ_Q3_Id = "EQ_Q3";
        public static readonly string EQ_Q3_Prompt = "The shaking has subsided, but aftershocks may follow. How will you evacuate?";
        public static readonly string EQ_Q3_OptionA_Id = "A";
        public static readonly string EQ_Q3_OptionA_Label = "Leave carefully using the stairs";
        public static readonly string EQ_Q3_OptionB_Id = "B";
        public static readonly string EQ_Q3_OptionB_Label = "Take the elevator down";
        public static readonly string EQ_Q3_Safe_Message = "Safe evacuation! Always take the stairs after a tremor. Elevators frequently fail or trap passengers.";
        public static readonly string EQ_Q3_Harm_Message = "Trapped hazard! Elevators can lose power instantly, warp in their shafts, or trigger emergency cutoffs after a tremor.";

        // Results Screen Texts
        public static readonly string TextResultTitle = "SIMULATION COMPLETE";
        public static readonly string TextResultSubtitleOffline = "EARTHQUAKE SURVIVAL ASSESSMENT";
        public static readonly string TextSummaryAllSafe = "Outstanding! You made all safe decisions. Drop, Cover, and Hold On saves lives.";
        public static readonly string TextSummaryPartial = "Completed! You survived, but review safety rules to minimize injury risks.";
        public static readonly string TextSummaryHazard = "Critical hazards encountered. Remember: Never run during tremors, and never use elevators.";
        public static readonly string TextButtonReplay = "Replay";
        public static readonly string TextButtonNextSim = "Next Simulation (Coming soon)";
        public static readonly string TextButtonPlayAgain = "Play Again";
        public static readonly string TextButtonLeaderboard = "View Leaderboard";
        public static readonly string TextButtonCloseLeaderboard = "Close";
        public static readonly string TextButtonRetry = "Retry";
        public static readonly string TextAnalyzingDecisions = "Analysing your decisions...";
        public static readonly string TextNetworkErrorPrompt = "Network request failed. Would you like to retry?";

        // Auth Texts
        public static readonly string TextAuthLoginTitle = "SURVIVAL AGENT LOGIN";
        public static readonly string TextAuthRegisterTitle = "NEW AGENT REGISTRATION";
        public static readonly string TextAuthUsernamePlaceholder = "Agent Username...";
        public static readonly string TextAuthPasswordPlaceholder = "Passcode...";
        public static readonly string TextAuthButtonLogin = "Sign In";
        public static readonly string TextAuthButtonRegister = "Create Profile";
        public static readonly string TextAuthSwitchToRegister = "Need an agent profile? Register here";
        public static readonly string TextAuthSwitchToLogin = "Already registered? Sign in";
        public static readonly string TextAuthPlayOffline = "Play Offline (Local Scenario)";
        #endregion

        #region 4. Resource Paths
        public static readonly string PathSpriteBackground = "Sprites/background_room";
        public static readonly string PathSpriteBackgroundDamaged = "Sprites/background_room_damaged";
        public static readonly string PathSpriteCharIdle = "Sprites/character_idle";
        public static readonly string PathSpriteCharHiding = "Sprites/character_hiding";
        public static readonly string PathSpriteCharRun = "Sprites/character_run";
        public static readonly string PathSpriteCharHurt = "Sprites/character_hurt";
        public static readonly string PathSpriteTable = "Sprites/table";
        public static readonly string PathSpriteDebris = "Sprites/ceiling_debris";
        public static readonly string PathSpriteDoor = "Sprites/door";

        public static readonly string PathAudioSiren = "Audio/siren";
        public static readonly string PathAudioRumble = "Audio/rumble";
        public static readonly string PathAudioDebrisCrash = "Audio/debris_crash";
        public static readonly string PathAudioClick = "Audio/click";
        public static readonly string PathAudioSuccess = "Audio/success";
        public static readonly string PathAudioFail = "Audio/fail";
        public static readonly string PathAudioCharHurt = "Audio/char_hurt";
        #endregion

        #region 5. Fire Simulation (Simulation 2)
        [Header("Fire Simulation - Layout & World Coordinates")]
        public static readonly Vector3 FireRoomBgPosition = new Vector3(0f, 0f, 0f);
        public static readonly Vector3 FireCorridorBgPosition = new Vector3(0f, 0f, 0f);
        public static readonly Vector3 FireRefugeBgPosition = new Vector3(0f, 0f, 0f);
        public static readonly Vector2 FireRoomBgSize = new Vector2(60f, 33.75f);
        public static readonly Vector2 FireCorridorBgSize = new Vector2(60f, 33.75f);
        public static readonly Vector2 FireRefugeBgSize = new Vector2(60f, 33.75f);

        // Fire door (leads from room to corridor) - Aligned to door in apartment room image
        public static readonly Vector3 FireDoorPosition = new Vector3(21.56f, -1.45f, 0f);
        public static readonly Vector2 FireDoorSize = new Vector2(4.1f, 11.4f);

        // Character crawl dimensions and positions
        // Hallway tiled floor is at Y = -6.5f. Standing height = 8.0f (center Y = -2.5f). Crawling height = 4.2f (center Y = -4.4f).
        public static readonly float CharacterCrawlingHeight = 4.2f;
        public static readonly Vector3 CharacterFireStartPos = new Vector3(-8f, -8.0f, 0f);
        public static readonly Vector3 CharacterDoorCheckPos = new Vector3(17.5f, -8.0f, 0f);
        public static readonly Vector3 CharacterCorridorStartPos = new Vector3(-20f, -2.5f, 0f);
        public static readonly Vector3 CharacterCrawlStartPos = new Vector3(-20f, -4.4f, 0f);
        public static readonly Vector3 CharacterCrawlMidPos = new Vector3(0f, -4.4f, 0f);
        public static readonly Vector3 CharacterCrawlEndPos = new Vector3(22f, -4.4f, 0f);
        public static readonly Vector3 CharacterExitStairsPos = new Vector3(18f, -2.5f, 0f);
        public static readonly Vector3 CharacterElevatorPos = new Vector3(6f, -2.5f, 0f);
        public static readonly Vector3 CharacterRetreatPos = new Vector3(-14f, -2.5f, 0f);

        // Smoke Layer
        public static readonly Vector3 SmokeLayerStartPosition = new Vector3(0f, 26f, 0f);
        public static readonly Vector3 SmokeLayerDescendPosition = new Vector3(0f, 10f, 0f);
        public static readonly Vector2 SmokeLayerSize = new Vector2(65f, 26f);
        public static readonly float SmokeDescendDuration = 3.0f;
        public static readonly float SmokeSafeLineY = -2.0f; // Head below this Y is safe
        public static readonly Color SmokeColor = new Color(1f, 1f, 1f, 0.95f);

        // Fire & Embers
        public static readonly Vector3 FireFlameDoorPosition = new Vector3(21.56f, -2.0f, 0f);
        public static readonly Vector2 FireFlameSize = new Vector2(4.5f, 7.0f);
        public static readonly int FireEmberPoolSize = 25;
        public static readonly Color FireEmberColor = new Color(1.0f, 0.45f, 0.05f, 0.95f);
        public static readonly float FireFlickerInterval = 0.14f;

        // Door Heat Check
        public static readonly Vector3 HandIconStartPos = new Vector3(18.0f, -2.0f, 0f);
        public static readonly Vector3 HandIconTargetPos = new Vector3(20.5f, -2.0f, 0f);
        public static readonly Vector2 HandIconSize = new Vector2(2.5f, 2.5f);
        public static readonly float HandMoveDuration = 0.85f;
        public static readonly Color DoorHeatGlowColor = new Color(1f, 0.35f, 0.05f, 0.75f);

        // Exit Route Props (Beat 3)
        public static readonly Vector3 ExitSignPosition = new Vector3(18f, 3.5f, 0f);
        public static readonly Vector2 ExitSignSize = new Vector2(6f, 3f);
        public static readonly Vector3 StairsPosition = new Vector3(18f, -7.5f, 0f);
        public static readonly Vector2 StairsSize = new Vector2(7f, 9f);
        public static readonly Vector3 ElevatorPosition = new Vector3(6f, -7.5f, 0f);
        public static readonly Vector2 ElevatorSize = new Vector2(6f, 9f);

        // Sorting orders for Fire
        public static readonly int SortingOrderFireBackground = 0;
        public static readonly int SortingOrderFireDoor = 1;
        public static readonly int SortingOrderFireRouteProps = 2;
        public static readonly int SortingOrderFireCharacter = 5;
        public static readonly int SortingOrderFireFlames = 8;
        public static readonly int SortingOrderFireEmbers = 12;
        public static readonly int SortingOrderFireSmoke = 15;
        public static readonly int SortingOrderFireHandIcon = 25;

        // Fire Simulation Resource Paths
        public static readonly string PathSpriteFireRoomBg = "Sprites/Fire/fire_room_background";
        public static readonly string PathSpriteFireCorridorBg = "Sprites/Fire/fire_corridor_background";
        public static readonly string PathSpriteFireRefugeBg = "Sprites/Fire/fire_refuge_background";
        public static readonly string PathSpriteFireCharIdle = "Sprites/Fire/character_idle";
        public static readonly string PathSpriteFireCharCrawl = "Sprites/Fire/character_crawl";
        public static readonly string PathSpriteFireCharCough = "Sprites/Fire/character_cough";
        public static readonly string PathSpriteFireCharHurt = "Sprites/Fire/character_hurt";
        public static readonly string PathSpriteFireDoorClosed = "Sprites/Fire/door_closed";
        public static readonly string PathSpriteFireDoorOpen = "Sprites/Fire/door_open";
        public static readonly string PathSpriteFireFlame1 = "Sprites/Fire/flame_1";
        public static readonly string PathSpriteFireFlame2 = "Sprites/Fire/flame_2";
        public static readonly string PathSpriteFireSmokeOverlay = "Sprites/Fire/smoke_overlay";
        public static readonly string PathSpriteFireExitSign = "Sprites/Fire/exit_sign";
        public static readonly string PathSpriteFireStairs = "Sprites/Fire/stairs";
        public static readonly string PathSpriteFireElevatorDoor = "Sprites/Fire/elevator_door";
        public static readonly string PathSpriteFireHandIcon = "Sprites/Fire/hand_icon";

        public static readonly string PathAudioFireAlarm = "Audio/fire_alarm";
        public static readonly string PathAudioFlameCrackle = "Audio/flame_crackle";
        public static readonly string PathAudioCough = "Audio/cough";
        public static readonly string PathAudioDoorOpen = "Audio/door_open";
        public static readonly string PathAudioFireTruck = "Audio/fire_truck";

        // Fire Simulation Questions & Strings
        public static readonly string TextAlertFire = "FIRE ALARM: A fire has been detected in the building. Evacuate immediately!";
        public static readonly string FR_Q1_Id = "FR_Q1";
        public static readonly string FR_Q1_Prompt = "The fire alarm sounds and smoke seeps under the door! What will you do?";
        public static readonly string FR_Q1_OptionA_Id = "A";
        public static readonly string FR_Q1_OptionA_Label = "Open the door and run out";
        public static readonly string FR_Q1_OptionB_Id = "B";
        public static readonly string FR_Q1_OptionB_Label = "Check the door with the back of your hand first";
        public static readonly string FR_Q1_Harm_Message = "Never open a door without checking it. A hot door means fire is right behind it.";
        public static readonly string FR_Q1_Safe_Message = "Good thinking! Checking a door for heat first helps you avoid the fire.";

        public static readonly string FR_Q2_Id = "FR_Q2";
        public static readonly string FR_Q2_Prompt = "The corridor is filling with smoke that sinks lower every second! How do you move?";
        public static readonly string FR_Q2_OptionA_Id = "A";
        public static readonly string FR_Q2_OptionA_Label = "Stand up straight and run through quickly";
        public static readonly string FR_Q2_OptionB_Id = "B";
        public static readonly string FR_Q2_OptionB_Label = "Stay low and crawl under the smoke";
        public static readonly string FR_Q2_Harm_Message = "Smoke rises. Breathing it in is the biggest danger in a fire.";
        public static readonly string FR_Q2_Safe_Message = "Smart! The cleanest air is near the floor. Stay low and move.";

        public static readonly string FR_Q3_Id = "FR_Q3";
        public static readonly string FR_Q3_Prompt = "You have reached the fire refuge area on the balcony. What should you do next?";
        public static readonly string FR_Q3_OptionA_Id = "A";
        public static readonly string FR_Q3_OptionA_Label = "Take the elevator";
        public static readonly string FR_Q3_OptionB_Id = "B";
        public static readonly string FR_Q3_OptionB_Label = "Wait for rescue in the refuge area";
        public static readonly string FR_Q3_OptionC_Id = "C";
        public static readonly string FR_Q3_OptionC_Label = "Go back for your phone and belongings";
        public static readonly string FR_Q3_Harm_Elevator_Message = "Never use elevators in a fire. Shafts act as chimneys for smoke and power failures trap you.";
        public static readonly string FR_Q3_Safe_Refuge_Message = "Correct! Fire-rated refuge areas provide clean air, emergency communication, and direct access for firefighters to rescue you.";
        public static readonly string FR_Q3_Harm_Belongings_Message = "Never re-enter a burning building for belongings. Flashovers and smoke inhalation happen in seconds.";

        // Fire Educational Feedback
        public static readonly string FireResultSubtitle = "FIRE & SMOKE EVACUATION ASSESSMENT";
        public static readonly string FireSummaryAllSafe = "Outstanding fire safety response! You checked doors for heat, stayed low beneath toxic smoke, and waited for rescue in the designated refuge area.";
        public static readonly string FireSummaryPartial = "You reached safety, but exposed yourself to hazardous fire risks. Review building fire evacuation guidelines.";
        public static readonly string FireSummaryHazard = "Critical hazards encountered. Remember: check doors for heat, crawl under smoke, use refuge areas, and never turn back for belongings.";
        public static readonly string FireKeyPrinciples = "• Check doors with the back of your hand before turning the handle.\n• Stay low and crawl under rising toxic smoke.\n• Wait for rescue in designated fire refuge areas with clean air.\n• Never use elevators or turn back for belongings.";

        // General Multi-Simulation UI Strings
        public static readonly string TextSimulationIndicatorFormat = "Simulation {0} of {1}";
        public static readonly string TextButtonNextSimReady = "Next Simulation";
        public static readonly string TextButtonBackToStart = "Back to Start";
        #endregion

        #region 6. Starter Screen UI
        [Header("Starter Screen - Layout & Typography")]
        public static readonly string TextStarterTitle = "DISASTER READY";
        public static readonly string TextStarterSubtitle = "SELECT A SURVIVAL SIMULATION TO BEGIN TRAINING";
        public static readonly Vector2 StarterCardSize = new Vector2(460f, 440f);
        public static readonly float StarterCardSpacing = 50f;
        public static readonly Color StarterBgColor = new Color(0.06f, 0.08f, 0.12f, 0.98f);
        public static readonly Color StarterCardBgColor = new Color(0.11f, 0.14f, 0.20f, 0.98f);
        public static readonly Color StarterCardBorderColor = new Color(0.20f, 0.26f, 0.36f, 1f);
        public static readonly string TextLaunchSimulation = "START SIMULATION";
        public static readonly string TextSelectSimulation = "Select Simulation";
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            useBackend = _useBackend;
            baseUrl = string.IsNullOrEmpty(_baseUrl) ? "http://localhost:4000" : _baseUrl;
            Register(this);
        }

        private void OnDestroy()
        {
            Unregister<GameLayoutManager>();
        }
        #endregion
    }
}

