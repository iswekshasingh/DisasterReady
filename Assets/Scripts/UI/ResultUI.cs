using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using DisasterSurvival.Core;
using DisasterSurvival.Audio;
using DisasterSurvival.Backend;
using DisasterSurvival.Scenario;

namespace DisasterSurvival.UI
{
    /// <summary>
    /// Displays outcome results for both offline mode and backend-connected mode.
    /// Handles scores, educational recaps, AI feedback, retry on failure, leaderboard modal,
    /// and dynamic progression to the next simulation.
    /// </summary>
    public class ResultUI : MonoBehaviour
    {
        private Text _titleText;
        private Text _subtitleText;
        private Text _scoreText;
        private Text _summaryText;

        private GameObject _offlineButtonGroup;
        private GameObject _backendButtonGroup;
        private Button _btnRetry;

        private Button _btnNextSim;
        private Text _btnNextSimText;
        private Button _btnBackendNextSim;
        private Text _btnBackendNextSimText;

        // Leaderboard sub-panel
        private GameObject _leaderboardPanel;
        private Text _leaderboardListText;

        private Image _dimBg;
        private Action _onReplayClicked;
        private Action _onNextSimClicked;
        private Action _onRetryClicked;
        private Action _onOpenLeaderboard;

        private void Awake()
        {
            GameLayoutManager.Register(this);
            try
            {
                BuildUI();
                BuildLeaderboardPanel();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[ResultUI] Build error: {ex}");
            }
            finally
            {
                gameObject.SetActive(false);
            }
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<ResultUI>();
        }

        private void OnDisable()
        {
            if (_dimBg != null) _dimBg.raycastTarget = false;
        }

        private void BuildUI()
        {
            RectTransform rootRt = UIHelper.EnsureRectTransform(gameObject);
            rootRt.anchorMin = Vector2.zero;
            rootRt.anchorMax = Vector2.one;
            rootRt.offsetMin = Vector2.zero;
            rootRt.offsetMax = Vector2.zero;

            // Dim backdrop
            _dimBg = gameObject.AddComponent<Image>();
            _dimBg.sprite = UIHelper.CreateWhiteSprite();
            _dimBg.color = new Color(0.04f, 0.06f, 0.1f, 0.88f);
            _dimBg.raycastTarget = false;

            // Main result card
            GameObject mainPanel = new GameObject("MainResultPanel");
            mainPanel.transform.SetParent(transform, false);
            Image cardBg = mainPanel.AddComponent<Image>();
            cardBg.sprite = UIHelper.CreateWhiteSprite();
            cardBg.color = new Color(0.1f, 0.14f, 0.2f, 0.98f);

            RectTransform cardRt = mainPanel.GetComponent<RectTransform>();
            cardRt.sizeDelta = GameLayoutManager.ResultPanelSize;
            cardRt.anchoredPosition = Vector2.zero;

            // Title
            GameObject titleObj = new GameObject("Title");
            titleObj.transform.SetParent(mainPanel.transform, false);
            _titleText = titleObj.AddComponent<Text>();
            _titleText.font = UIHelper.GetDefaultFont();
            _titleText.fontSize = 38;
            _titleText.color = new Color(0.35f, 0.8f, 1f, 1f);
            _titleText.alignment = TextAnchor.MiddleCenter;
            RectTransform titleRt = titleObj.GetComponent<RectTransform>();
            titleRt.anchorMin = new Vector2(0f, 1f);
            titleRt.anchorMax = new Vector2(1f, 1f);
            titleRt.pivot = new Vector2(0.5f, 1f);
            titleRt.anchoredPosition = new Vector2(0f, -25f);
            titleRt.sizeDelta = new Vector2(0f, 50f);

            // Subtitle
            GameObject subObj = new GameObject("Subtitle");
            subObj.transform.SetParent(mainPanel.transform, false);
            _subtitleText = subObj.AddComponent<Text>();
            _subtitleText.font = UIHelper.GetDefaultFont();
            _subtitleText.fontSize = 24;
            _subtitleText.color = new Color(0.8f, 0.85f, 0.9f, 1f);
            _subtitleText.alignment = TextAnchor.MiddleCenter;
            RectTransform subRt = subObj.GetComponent<RectTransform>();
            subRt.anchorMin = new Vector2(0f, 1f);
            subRt.anchorMax = new Vector2(1f, 1f);
            subRt.pivot = new Vector2(0.5f, 1f);
            subRt.anchoredPosition = new Vector2(0f, -80f);
            subRt.sizeDelta = new Vector2(0f, 40f);

            // Score display
            GameObject scoreObj = new GameObject("Score");
            scoreObj.transform.SetParent(mainPanel.transform, false);
            _scoreText = scoreObj.AddComponent<Text>();
            _scoreText.font = UIHelper.GetDefaultFont();
            _scoreText.fontSize = 44;
            _scoreText.color = new Color(0.2f, 0.95f, 0.45f, 1f);
            _scoreText.alignment = TextAnchor.MiddleCenter;
            RectTransform scoreRt = scoreObj.GetComponent<RectTransform>();
            scoreRt.anchorMin = new Vector2(0f, 1f);
            scoreRt.anchorMax = new Vector2(1f, 1f);
            scoreRt.pivot = new Vector2(0.5f, 1f);
            scoreRt.anchoredPosition = new Vector2(0f, -135f);
            scoreRt.sizeDelta = new Vector2(0f, 60f);

            // Scrollable Content Area (Educational Summary / AI Feedback)
            BuildScrollArea(mainPanel);

            // Offline Buttons
            _offlineButtonGroup = new GameObject("OfflineButtons");
            _offlineButtonGroup.transform.SetParent(mainPanel.transform, false);
            RectTransform offRt = UIHelper.EnsureRectTransform(_offlineButtonGroup);
            offRt.anchorMin = new Vector2(0f, 0f);
            offRt.anchorMax = new Vector2(1f, 0f);
            offRt.pivot = new Vector2(0.5f, 0f);
            offRt.anchoredPosition = new Vector2(0f, 25f);
            offRt.sizeDelta = new Vector2(0f, 90f);

            Button btnReplay = UIHelper.CreateStyledButton(
                _offlineButtonGroup,
                "BtnReplay",
                GameLayoutManager.TextButtonReplay,
                new Vector2(250f, 75f),
                new Color(0.18f, 0.45f, 0.75f, 1f),
                Color.white,
                24,
                () =>
                {
                    PlayClickSound();
                    gameObject.SetActive(false);
                    _onReplayClicked?.Invoke();
                }
            );
            btnReplay.GetComponent<RectTransform>().anchoredPosition = new Vector2(-290f, 0f);

            _btnNextSim = UIHelper.CreateStyledButton(
                _offlineButtonGroup,
                "BtnNextSim",
                GameLayoutManager.TextButtonNextSimReady,
                new Vector2(300f, 75f),
                new Color(0.18f, 0.65f, 0.45f, 1f),
                Color.white,
                20,
                () =>
                {
                    PlayClickSound();
                    gameObject.SetActive(false);
                    _onNextSimClicked?.Invoke();
                }
            );
            _btnNextSimText = _btnNextSim.GetComponentInChildren<Text>();
            _btnNextSim.GetComponent<RectTransform>().anchoredPosition = new Vector2(20f, 0f);

            Button btnSelectSim = UIHelper.CreateStyledButton(
                _offlineButtonGroup,
                "BtnSelectSim",
                GameLayoutManager.TextSelectSimulation,
                new Vector2(250f, 75f),
                new Color(0.35f, 0.4f, 0.5f, 1f),
                Color.white,
                20,
                () =>
                {
                    PlayClickSound();
                    gameObject.SetActive(false);
                    GameManager gm = GameLayoutManager.Get<GameManager>();
                    if (gm != null)
                    {
                        gm.ReturnToStarterScreen();
                    }
                }
            );
            btnSelectSim.GetComponent<RectTransform>().anchoredPosition = new Vector2(310f, 0f);

            // Backend Buttons
            _backendButtonGroup = new GameObject("BackendButtons");
            _backendButtonGroup.transform.SetParent(mainPanel.transform, false);
            RectTransform backRt = UIHelper.EnsureRectTransform(_backendButtonGroup);
            backRt.anchorMin = new Vector2(0f, 0f);
            backRt.anchorMax = new Vector2(1f, 0f);
            backRt.pivot = new Vector2(0.5f, 0f);
            backRt.anchoredPosition = new Vector2(0f, 25f);
            backRt.sizeDelta = new Vector2(0f, 90f);

            Button btnPlayAgain = UIHelper.CreateStyledButton(
                _backendButtonGroup,
                "BtnPlayAgain",
                GameLayoutManager.TextButtonPlayAgain,
                new Vector2(260f, 75f),
                new Color(0.18f, 0.45f, 0.75f, 1f),
                Color.white,
                24,
                () =>
                {
                    PlayClickSound();
                    gameObject.SetActive(false);
                    _onReplayClicked?.Invoke();
                }
            );
            btnPlayAgain.GetComponent<RectTransform>().anchoredPosition = new Vector2(-280f, 0f);

            _btnBackendNextSim = UIHelper.CreateStyledButton(
                _backendButtonGroup,
                "BtnBackendNextSim",
                GameLayoutManager.TextButtonNextSimReady,
                new Vector2(300f, 75f),
                new Color(0.18f, 0.65f, 0.45f, 1f),
                Color.white,
                20,
                () =>
                {
                    PlayClickSound();
                    gameObject.SetActive(false);
                    _onNextSimClicked?.Invoke();
                }
            );
            _btnBackendNextSimText = _btnBackendNextSim.GetComponentInChildren<Text>();
            _btnBackendNextSim.GetComponent<RectTransform>().anchoredPosition = new Vector2(20f, 0f);

            Button btnLeaderboard = UIHelper.CreateStyledButton(
                _backendButtonGroup,
                "BtnLeaderboard",
                GameLayoutManager.TextButtonLeaderboard,
                new Vector2(260f, 75f),
                new Color(0.2f, 0.6f, 0.4f, 1f),
                Color.white,
                22,
                () =>
                {
                    PlayClickSound();
                    _onOpenLeaderboard?.Invoke();
                }
            );
            btnLeaderboard.GetComponent<RectTransform>().anchoredPosition = new Vector2(300f, 0f);

            // Retry Button for network failures
            _btnRetry = UIHelper.CreateStyledButton(
                mainPanel,
                "BtnRetry",
                GameLayoutManager.TextButtonRetry,
                new Vector2(300f, 75f),
                new Color(0.85f, 0.3f, 0.2f, 1f),
                Color.white,
                26,
                () => _onRetryClicked?.Invoke()
            );
            _btnRetry.GetComponent<RectTransform>().anchoredPosition = new Vector2(0f, -220f);
            _btnRetry.gameObject.SetActive(false);
        }

        private void BuildScrollArea(GameObject parent)
        {
            GameObject scrollObj = new GameObject("ScrollArea");
            scrollObj.transform.SetParent(parent.transform, false);

            ScrollRect scrollRect = scrollObj.AddComponent<ScrollRect>();
            scrollRect.horizontal = false;
            scrollRect.vertical = true;
            scrollRect.movementType = ScrollRect.MovementType.Clamped;

            RectTransform scrollRt = scrollObj.GetComponent<RectTransform>();
            scrollRt.anchorMin = new Vector2(0f, 0f);
            scrollRt.anchorMax = new Vector2(1f, 1f);
            scrollRt.offsetMin = new Vector2(50f, 120f);
            scrollRt.offsetMax = new Vector2(-50f, -210f);

            // Viewport with RectMask2D
            GameObject viewport = new GameObject("Viewport");
            viewport.transform.SetParent(scrollObj.transform, false);
            viewport.AddComponent<RectMask2D>();
            RectTransform viewRt = UIHelper.EnsureRectTransform(viewport);
            viewRt.anchorMin = Vector2.zero;
            viewRt.anchorMax = Vector2.one;
            viewRt.offsetMin = Vector2.zero;
            viewRt.offsetMax = Vector2.zero;
            scrollRect.viewport = viewRt;

            // Content
            GameObject content = new GameObject("Content");
            content.transform.SetParent(viewport.transform, false);
            RectTransform contentRt = UIHelper.EnsureRectTransform(content);
            contentRt.anchorMin = new Vector2(0f, 1f);
            contentRt.anchorMax = new Vector2(1f, 1f);
            contentRt.pivot = new Vector2(0.5f, 1f);
            contentRt.anchoredPosition = Vector2.zero;
            contentRt.sizeDelta = new Vector2(0f, 320f);
            scrollRect.content = contentRt;

            // Summary text
            GameObject summaryObj = new GameObject("SummaryText");
            summaryObj.transform.SetParent(content.transform, false);
            _summaryText = summaryObj.AddComponent<Text>();
            _summaryText.font = UIHelper.GetDefaultFont();
            _summaryText.fontSize = 24;
            _summaryText.color = new Color(0.9f, 0.95f, 1f, 1f);
            _summaryText.alignment = TextAnchor.UpperLeft;
            _summaryText.horizontalOverflow = HorizontalWrapMode.Wrap;
            _summaryText.verticalOverflow = VerticalWrapMode.Overflow;

            RectTransform sumRt = summaryObj.GetComponent<RectTransform>();
            sumRt.anchorMin = Vector2.zero;
            sumRt.anchorMax = Vector2.one;
            sumRt.offsetMin = Vector2.zero;
            sumRt.offsetMax = Vector2.zero;
        }

        private void BuildLeaderboardPanel()
        {
            _leaderboardPanel = new GameObject("LeaderboardModal");
            _leaderboardPanel.transform.SetParent(transform, false);

            Image panelBg = _leaderboardPanel.AddComponent<Image>();
            panelBg.sprite = UIHelper.CreateWhiteSprite();
            panelBg.color = new Color(0.08f, 0.12f, 0.18f, 0.98f);

            RectTransform leadRt = _leaderboardPanel.GetComponent<RectTransform>();
            leadRt.sizeDelta = new Vector2(900f, 700f);
            leadRt.anchoredPosition = Vector2.zero;

            // Leaderboard Title
            Text leadTitle = UIHelper.CreateText(_leaderboardPanel, "LeadTitle", "AGENT LEADERBOARD", 34, new Color(0.35f, 0.85f, 1f, 1f));
            RectTransform titleRt = leadTitle.GetComponent<RectTransform>();
            titleRt.anchorMin = new Vector2(0f, 1f);
            titleRt.anchorMax = new Vector2(1f, 1f);
            titleRt.pivot = new Vector2(0.5f, 1f);
            titleRt.anchoredPosition = new Vector2(0f, -25f);
            titleRt.sizeDelta = new Vector2(0f, 50f);

            // Leaderboard content text
            GameObject listObj = new GameObject("ListText");
            listObj.transform.SetParent(_leaderboardPanel.transform, false);
            _leaderboardListText = listObj.AddComponent<Text>();
            _leaderboardListText.font = UIHelper.GetDefaultFont();
            _leaderboardListText.fontSize = 22;
            _leaderboardListText.color = Color.white;
            _leaderboardListText.alignment = TextAnchor.UpperLeft;
            _leaderboardListText.lineSpacing = 1.3f;

            RectTransform listRt = listObj.GetComponent<RectTransform>();
            listRt.anchorMin = new Vector2(0f, 0f);
            listRt.anchorMax = new Vector2(1f, 1f);
            listRt.offsetMin = new Vector2(50f, 110f);
            listRt.offsetMax = new Vector2(-50f, -90f);

            // Close button
            Button btnClose = UIHelper.CreateStyledButton(
                _leaderboardPanel,
                "BtnCloseLeaderboard",
                GameLayoutManager.TextButtonCloseLeaderboard,
                new Vector2(240f, 65f),
                new Color(0.4f, 0.45f, 0.55f, 1f),
                Color.white,
                24,
                () => _leaderboardPanel.SetActive(false)
            );
            btnClose.GetComponent<RectTransform>().anchoredPosition = new Vector2(0f, -280f);

            _leaderboardPanel.SetActive(false);
        }

        public void ShowOfflineResults(int safeDecisions, int totalDecisions, Action onReplay)
        {
            ShowOfflineResults(safeDecisions, totalDecisions, 0, null, onReplay, null);
        }

        public void ShowOfflineResults(int safeDecisions, int totalDecisions, int currentSimIndex, SimulationDefinition simDef, Action onReplay, Action onNextSim)
        {
            if (_dimBg != null) _dimBg.raycastTarget = true;
            _onReplayClicked = onReplay;
            _onNextSimClicked = onNextSim;
            _offlineButtonGroup.SetActive(true);
            _backendButtonGroup.SetActive(false);
            _btnRetry.gameObject.SetActive(false);
            _leaderboardPanel.SetActive(false);

            _titleText.text = GameLayoutManager.TextResultTitle;
            _subtitleText.text = simDef != null ? simDef.DisplayTitle.ToUpperInvariant() : GameLayoutManager.TextResultSubtitleOffline;
            _scoreText.text = $"{safeDecisions} / {totalDecisions} Safe Decisions";

            // Configure Next Simulation button
            ConfigureNextSimButton(_btnNextSim, _btnNextSimText, currentSimIndex, onNextSim);

            // Educational feedback
            if (simDef != null)
            {
                if (safeDecisions == totalDecisions)
                {
                    _scoreText.color = new Color(0.2f, 0.95f, 0.45f, 1f);
                    _summaryText.text = $"{simDef.EducationalSummaryAllSafe}\n\nKey Principles Learned:\n{simDef.KeyPrinciplesText}";
                }
                else if (safeDecisions > 0)
                {
                    _scoreText.color = new Color(1f, 0.8f, 0.2f, 1f);
                    _summaryText.text = $"{simDef.EducationalSummaryPartial}\n\nImportant Points to Remember:\n{simDef.KeyPrinciplesText}";
                }
                else
                {
                    _scoreText.color = new Color(0.95f, 0.3f, 0.25f, 1f);
                    _summaryText.text = $"{simDef.EducationalSummaryHazard}\n\nCritical Takeaways:\n{simDef.KeyPrinciplesText}";
                }
            }
            else
            {
                if (safeDecisions == totalDecisions)
                {
                    _scoreText.color = new Color(0.2f, 0.95f, 0.45f, 1f);
                    _summaryText.text = GameLayoutManager.TextSummaryAllSafe;
                }
                else if (safeDecisions > 0)
                {
                    _scoreText.color = new Color(1f, 0.8f, 0.2f, 1f);
                    _summaryText.text = GameLayoutManager.TextSummaryPartial;
                }
                else
                {
                    _scoreText.color = new Color(0.95f, 0.3f, 0.25f, 1f);
                    _summaryText.text = GameLayoutManager.TextSummaryHazard;
                }
            }

            gameObject.SetActive(true);

            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null)
            {
                audio.PlaySound(safeDecisions > 0 ? GameLayoutManager.PathAudioSuccess : GameLayoutManager.PathAudioFail);
            }
        }

        public void ShowBackendResults(AttemptResultResponse response, Action onPlayAgain, Action onOpenLeaderboard)
        {
            ShowBackendResults(response, 0, null, onPlayAgain, null, onOpenLeaderboard);
        }

        public void ShowBackendResults(AttemptResultResponse response, int currentSimIndex, SimulationDefinition simDef, Action onPlayAgain, Action onNextSim, Action onOpenLeaderboard)
        {
            if (_dimBg != null) _dimBg.raycastTarget = true;
            _onReplayClicked = onPlayAgain;
            _onNextSimClicked = onNextSim;
            _onOpenLeaderboard = onOpenLeaderboard;
            _offlineButtonGroup.SetActive(false);
            _backendButtonGroup.SetActive(true);
            _btnRetry.gameObject.SetActive(false);
            _leaderboardPanel.SetActive(false);

            _titleText.text = GameLayoutManager.TextResultTitle;
            bool passed = response != null && response.passed;
            _subtitleText.text = passed ? "EVALUATION: PASSED" : "EVALUATION: NEEDS REVIEW";
            _subtitleText.color = passed ? new Color(0.3f, 0.9f, 0.4f, 1f) : new Color(0.95f, 0.4f, 0.3f, 1f);

            int score = response != null ? response.score : 0;
            int maxScore = response != null ? response.maxScore : 100;
            _scoreText.text = $"Score: {score} / {maxScore}";
            _scoreText.color = passed ? new Color(0.2f, 0.95f, 0.45f, 1f) : new Color(1f, 0.75f, 0.2f, 1f);

            // Configure Next Simulation button in backend mode
            ConfigureNextSimButton(_btnBackendNextSim, _btnBackendNextSimText, currentSimIndex, onNextSim);

            string feedback = (response != null && !string.IsNullOrEmpty(response.feedback))
            ? response.feedback
            : "Your disaster mitigation decisions have been recorded and scored.";
            _summaryText.text = "AI FEEDBACK:\n\n" + feedback;

            gameObject.SetActive(true);

            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null)
            {
                audio.PlaySound(passed ? GameLayoutManager.PathAudioSuccess : GameLayoutManager.PathAudioFail);
            }
        }

        private void ConfigureNextSimButton(Button button, Text label, int currentSimIndex, Action onNextSim)
        {
            if (button == null) return;

            bool hasNext = SimulationRegistry.HasNext(currentSimIndex);
            button.interactable = (onNextSim != null);

            if (label != null)
            {
                if (hasNext)
                {
                    SimulationDefinition nextDef = SimulationRegistry.GetSimulation(currentSimIndex + 1);
                    label.text = $"Next: {nextDef.DisplayTitle}";
                }
                else
                {
                    label.text = GameLayoutManager.TextButtonBackToStart;
                }
            }
        }

        public void ShowNetworkFailure(string error, Action onRetry)
        {
            if (_dimBg != null) _dimBg.raycastTarget = true;
            _onRetryClicked = onRetry;
            _offlineButtonGroup.SetActive(false);
            _backendButtonGroup.SetActive(false);
            _btnRetry.gameObject.SetActive(true);

            _titleText.text = "SUBMISSION FAILED";
            _subtitleText.text = "Communication Error";
            _scoreText.text = "";
            _summaryText.text = $"{GameLayoutManager.TextNetworkErrorPrompt}\n\nDetails: {error}";

            gameObject.SetActive(true);
        }

        public void DisplayLeaderboard(List<LeaderboardEntry> entries)
        {
            _leaderboardPanel.SetActive(true);

            if (entries == null || entries.Count == 0)
            {
                _leaderboardListText.text = "No records found on leaderboard yet.";
                return;
            }

            System.Text.StringBuilder sb = new System.Text.StringBuilder();
            sb.AppendLine("RANK      AGENT                  TOTAL POINTS");
            sb.AppendLine("---------------------------------------------");

            for (int i = 0; i < entries.Count; i++)
            {
                LeaderboardEntry entry = entries[i];
                string rank = (i + 1).ToString().PadRight(8);
                string username = (entry.username ?? "Anonymous").PadRight(20);
                string pts = $"{entry.totalPoints} pts";

                sb.AppendLine($"{rank}  {username}  {pts}");
            }

            _leaderboardListText.text = sb.ToString();
        }

        private void PlayClickSound()
        {
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null)
            {
                audio.PlaySound(GameLayoutManager.PathAudioClick);
            }
        }
    }
}
