using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.UI;
using DisasterSurvival.Core;
using DisasterSurvival.Audio;
using DisasterSurvival.Backend;
using DisasterSurvival.Scenario;

namespace DisasterSurvival.UI
{
    /// <summary>Shared simulation results board used for offline and backend results.</summary>
    public class ResultUI : MonoBehaviour
    {
        private static readonly Color Ink = new Color(0.25f, 0.12f, 0.11f, 1f);
        private static readonly Color Paper = new Color(0.91f, 0.77f, 0.60f, 1f);
        private static readonly Color Green = new Color(0.24f, 0.67f, 0.34f, 1f);
        private static readonly Color Gold = new Color(1f, 0.72f, 0.12f, 1f);
        private static readonly Color Muted = new Color(0.43f, 0.38f, 0.38f, 1f);

        private Text _titleText;
        private Text _subtitleText;
        private Text _scoreText;
        private Text _statusText;
        private Text _continueLabel;
        private Text[] _stars = new Text[3];
        private GameObject _mainContent;
        private GameObject _checkpointRows;
        private GameObject _learningRows;
        private GameObject _leaderboardPanel;
        private Text _leaderboardListText;
        private Button _btnRetry;
        private Action _onReplayClicked;
        private Action _onNextSimClicked;
        private Action _onRetryClicked;
        private Action _onOpenLeaderboard;
        private Image _dimBg;

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
            finally { gameObject.SetActive(false); }
        }

        private void OnDestroy() => GameLayoutManager.Unregister<ResultUI>();

        private void OnDisable()
        {
            if (_dimBg != null) _dimBg.raycastTarget = false;
        }

        private void BuildUI()
        {
            RectTransform root = UIHelper.EnsureRectTransform(gameObject);
            root.anchorMin = Vector2.zero;
            root.anchorMax = Vector2.one;
            root.offsetMin = Vector2.zero;
            root.offsetMax = Vector2.zero;

            _dimBg = gameObject.AddComponent<Image>();
            _dimBg.sprite = UIHelper.CreateWhiteSprite();
            _dimBg.color = new Color(0.07f, 0.055f, 0.09f, 0.94f);
            _dimBg.raycastTarget = true;

            GameObject card = MakePanel("ResultsBoard", Paper, new Vector2(1500f, 930f), Vector2.zero, transform);
            _mainContent = card;
            MakePanel("BoardInset", new Color(0.95f, 0.83f, 0.68f, 1f), new Vector2(1450f, 880f), Vector2.zero, card.transform);
            // Bring inset behind the board content.
            _mainContent.transform.GetChild(0).SetAsFirstSibling();

            Image border = card.GetComponent<Image>();
            border.color = new Color(0.55f, 0.28f, 0.15f, 1f);
            MakePanel("Paper", new Color(0.92f, 0.79f, 0.63f, 1f), new Vector2(1440f, 870f), Vector2.zero, card.transform);
            card.transform.GetChild(1).SetAsFirstSibling();

            MakeText(card, "Title", GameLayoutManager.TextResultTitle, 42, new Color(1f, 0.93f, 0.83f), new Vector2(0, 374), new Vector2(1000, 74), new Color(0.28f, 0.65f, 0.36f));
            _titleText = card.transform.Find("Title/Label")?.GetComponent<Text>();
            _subtitleText = MakeText(card, "SimulationName", "SIMULATION", 32, Ink, new Vector2(0, 308), new Vector2(900, 55));

            for (int i = 0; i < 3; i++)
                _stars[i] = MakeText(card, "Star" + i, "★", 90, Muted, new Vector2((i - 1) * 155f, 218), new Vector2(140, 110));

            _scoreText = MakeText(card, "Score", "0 / 3 SAFE DECISIONS", 42, Ink, new Vector2(0, 92), new Vector2(1000, 62));
            _statusText = MakeText(card, "Status", "KEEP PRACTISING", 26, Ink, new Vector2(0, 39), new Vector2(400, 48), new Color(0.78f, 0.55f, 0.38f));
            MakePanel("Divider", new Color(0.63f, 0.38f, 0.23f, 1f), new Vector2(1350, 3), new Vector2(0, -8), card.transform);

            MakeText(card, "DecisionHeading", "YOUR DECISIONS", 28, new Color(0.46f, 0.24f, 0.15f), new Vector2(-390, -54), new Vector2(570, 48));
            MakeText(card, "LearningHeading", "WHAT YOU LEARNED", 28, new Color(0.46f, 0.24f, 0.15f), new Vector2(390, -54), new Vector2(580, 48));
            _checkpointRows = new GameObject("CheckpointRows");
            _checkpointRows.transform.SetParent(card.transform, false);
            RectTransform checkpointRt = UIHelper.EnsureRectTransform(_checkpointRows);
            checkpointRt.anchorMin = checkpointRt.anchorMax = new Vector2(0.5f, 0.5f);
            checkpointRt.anchoredPosition = new Vector2(-390, -74);
            checkpointRt.sizeDelta = Vector2.zero;
            _learningRows = new GameObject("LearningRows");
            _learningRows.transform.SetParent(card.transform, false);
            RectTransform learningRt = UIHelper.EnsureRectTransform(_learningRows);
            learningRt.anchorMin = learningRt.anchorMax = new Vector2(0.5f, 0.5f);
            learningRt.anchoredPosition = new Vector2(390, -74);
            learningRt.sizeDelta = Vector2.zero;

            Button replay = AddButton(card, "Replay", "REPLAY", new Vector2(-510, -390), new Vector2(360, 78), new Color(0.24f, 0.43f, 0.76f), () =>
            {
                PlayClickSound(); gameObject.SetActive(false); _onReplayClicked?.Invoke();
            });
            Button middle = AddButton(card, "Continue", "BACK TO START", new Vector2(0, -390), new Vector2(410, 78), Green, () =>
            {
                PlayClickSound(); gameObject.SetActive(false);
                if (_onNextSimClicked != null) _onNextSimClicked.Invoke();
                else ReturnToStarter();
            });
            _continueLabel = middle.GetComponentInChildren<Text>();
            Button select = AddButton(card, "SelectSimulation", "SELECT SIM.", new Vector2(510, -390), new Vector2(360, 78), new Color(0.58f, 0.35f, 0.23f), () =>
            {
                PlayClickSound(); gameObject.SetActive(false); ReturnToStarter();
            });
            replay.gameObject.name = "BtnReplay";
            middle.gameObject.name = "BtnContinue";
            select.gameObject.name = "BtnSelectSimulation";

            _btnRetry = AddButton(card, "Retry", GameLayoutManager.TextButtonRetry, new Vector2(0, -390), new Vector2(360, 78), new Color(0.78f, 0.25f, 0.2f), () => _onRetryClicked?.Invoke());
            _btnRetry.gameObject.SetActive(false);
        }

        private GameObject MakePanel(string name, Color color, Vector2 size, Vector2 pos, Transform parent)
        {
            Image image = UIHelper.CreatePanel(parent.gameObject, name, color, size, pos);
            image.raycastTarget = false;
            return image.gameObject;
        }

        private Text MakeText(GameObject parent, string name, string value, int size, Color color, Vector2 pos, Vector2 dimensions, Color? background = null)
        {
            GameObject holder = parent;
            if (background.HasValue) holder = MakePanel(name, background.Value, dimensions, pos, parent.transform);
            Text text = UIHelper.CreateText(holder, background.HasValue ? "Label" : name, value, size, color, TextAnchor.MiddleCenter);
            RectTransform rt = text.GetComponent<RectTransform>();
            if (background.HasValue)
            {
                rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
                rt.offsetMin = Vector2.zero; rt.offsetMax = Vector2.zero;
            }
            else
            {
                rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
                rt.pivot = new Vector2(0.5f, 0.5f);
                rt.anchoredPosition = pos;
                rt.sizeDelta = dimensions;
            }
            text.fontStyle = FontStyle.Bold;
            text.raycastTarget = false;
            return text;
        }

        private Button AddButton(GameObject parent, string name, string label, Vector2 pos, Vector2 size, Color color, Action action)
        {
            Button button = UIHelper.CreateStyledButton(parent, name, label, size, color, Color.white, 25, action);
            RectTransform rt = button.GetComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = pos;
            return button;
        }

        private void BuildLeaderboardPanel()
        {
            _leaderboardPanel = MakePanel("LeaderboardModal", new Color(0.12f, 0.1f, 0.16f, 0.98f), new Vector2(900, 700), Vector2.zero, transform);
            _leaderboardListText = MakeText(_leaderboardPanel, "ListText", "", 22, Color.white, Vector2.zero, new Vector2(800, 500), null);
            RectTransform rt = _leaderboardListText.rectTransform;
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = new Vector2(0, 20);
            _leaderboardListText.alignment = TextAnchor.UpperLeft;
            Button close = AddButton(_leaderboardPanel, "Close", "CLOSE", new Vector2(0, -285), new Vector2(240, 65), new Color(0.4f, 0.45f, 0.55f), () => _leaderboardPanel.SetActive(false));
            _leaderboardPanel.SetActive(false);
        }

        public void ShowOfflineResults(int safeDecisions, int totalDecisions, Action onReplay)
        {
            ShowOfflineResults(safeDecisions, totalDecisions, 0, null, onReplay, null, null);
        }

        public void ShowOfflineResults(int safeDecisions, int totalDecisions, int currentSimIndex, SimulationDefinition simDef, Action onReplay, Action onNextSim, IList<bool> decisionWasSafe = null)
        {
            _onReplayClicked = onReplay;
            _onNextSimClicked = SimulationRegistry.HasNext(currentSimIndex) ? onNextSim : null;
            if (_continueLabel != null) _continueLabel.text = _onNextSimClicked != null ? "NEXT SIM" : "BACK TO START";
            ShowBoard(safeDecisions, totalDecisions, simDef, decisionWasSafe,
                safeDecisions == totalDecisions ? ReadyLabel(simDef) : safeDecisions > 0 ? "KEEP PRACTISING" : "REVIEW SAFETY", null);
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null) audio.PlaySound(safeDecisions > 0 ? GameLayoutManager.PathAudioSuccess : GameLayoutManager.PathAudioFail);
        }

        public void ShowBackendResults(AttemptResultResponse response, Action onPlayAgain, Action onOpenLeaderboard)
        {
            ShowBackendResults(response, 0, null, onPlayAgain, null, onOpenLeaderboard, null);
        }

        public void ShowBackendResults(AttemptResultResponse response, int currentSimIndex, SimulationDefinition simDef, Action onPlayAgain, Action onNextSim, Action onOpenLeaderboard, IList<bool> decisionWasSafe = null)
        {
            _onReplayClicked = onPlayAgain;
            _onNextSimClicked = SimulationRegistry.HasNext(currentSimIndex) ? onNextSim : null;
            if (_continueLabel != null) _continueLabel.text = _onNextSimClicked != null ? "NEXT SIM" : "BACK TO START";
            _onOpenLeaderboard = onOpenLeaderboard;
            int score = response != null ? response.score : 0;
            int safeCount = decisionWasSafe != null && decisionWasSafe.Count > 0 ? CountSafe(decisionWasSafe) : (response != null && response.passed ? 3 : Mathf.Clamp(Mathf.RoundToInt(score / 100f * 3f), 0, 3));
            ShowBoard(safeCount, 3, simDef, decisionWasSafe, response != null && response.passed ? "SIMULATION PASSED" : "KEEP PRACTISING",
                response != null ? response.feedback : null);
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null) audio.PlaySound(response != null && response.passed ? GameLayoutManager.PathAudioSuccess : GameLayoutManager.PathAudioFail);
        }

        private void ShowBoard(int safeCount, int decisionCount, SimulationDefinition simDef, IList<bool> decisions, string status, string feedback)
        {
            _dimBg.raycastTarget = true;
            _mainContent.SetActive(true);
            _btnRetry.gameObject.SetActive(false);
            _leaderboardPanel.SetActive(false);
            _titleText.text = GameLayoutManager.TextResultTitle;
            _subtitleText.text = simDef != null ? simDef.DisplayTitle.ToUpperInvariant() : GameLayoutManager.TextResultSubtitleOffline;
            int stars = Mathf.Clamp(safeCount, 0, 3);
            for (int i = 0; i < _stars.Length; i++)
            {
                _stars[i].color = i < stars ? Gold : Muted;
                _stars[i].text = "★";
            }
            _scoreText.text = $"{safeCount} / {Mathf.Max(1, decisionCount)} SAFE DECISIONS";
            _scoreText.color = stars == 3 ? Green : stars == 0 ? new Color(0.75f, 0.27f, 0.22f) : new Color(0.72f, 0.39f, 0.14f);
            _statusText.text = status;
            _statusText.color = Ink;
            FillResultRows(simDef, decisions, decisionCount, feedback);
            gameObject.SetActive(true);
        }

        private void FillResultRows(SimulationDefinition simDef, IList<bool> decisions, int decisionCount, string feedback)
        {
            ClearChildren(_checkpointRows.transform);
            ClearChildren(_learningRows.transform);
            int rowCount = Mathf.Min(3, Mathf.Max(decisionCount, simDef != null && simDef.ResultCheckpointLabels != null ? simDef.ResultCheckpointLabels.Count : 0));
            rowCount = Mathf.Max(1, rowCount);
            for (int i = 0; i < rowCount; i++)
            {
                string label = simDef != null && simDef.ResultCheckpointLabels != null && i < simDef.ResultCheckpointLabels.Count
                    ? simDef.ResultCheckpointLabels[i] : $"DECISION {i + 1}";
                bool known = decisions != null && i < decisions.Count;
                bool safe = known && decisions[i];
                Color rowColor = safe ? new Color(0.86f, 0.82f, 0.63f) : new Color(0.91f, 0.72f, 0.64f);
                GameObject row = MakePanel("Checkpoint" + i, rowColor, new Vector2(600, 65), new Vector2(0, -44 - i * 74), _checkpointRows.transform);
                RectTransform rowRt = row.GetComponent<RectTransform>(); rowRt.anchorMin = rowRt.anchorMax = new Vector2(0.5f, 0.5f);
                MakeText(row, "Mark", known ? (safe ? "✓" : "×") : "•", 32, known ? (safe ? Green : new Color(0.78f, 0.2f, 0.18f)) : Muted, new Vector2(-266, 0), new Vector2(55, 55), new Color(0.92f, 0.86f, 0.72f));
                Text rowText = MakeText(row, "CheckpointLabel", label, 24, Ink, new Vector2(20, 0), new Vector2(465, 58));
                rowText.alignment = TextAnchor.MiddleLeft;
                MakeText(row, "CheckpointNumber", (i + 1).ToString(), 20, new Color(0.55f, 0.32f, 0.19f), new Vector2(280, 0), new Vector2(30, 55));
            }

            List<string> lessons = simDef != null ? simDef.ResultLearningLabels : null;
            if (lessons == null || lessons.Count == 0) lessons = new List<string> { "Follow the safest route", "Avoid immediate hazards", "Call for help and wait for rescue" };
            int lessonsToShow = Mathf.Min(3, lessons.Count);
            for (int i = 0; i < lessonsToShow; i++)
            {
                MakeText(_learningRows, "LessonIcon" + i, (i + 1).ToString(), 25, i == 1 ? new Color(0.68f, 0.45f, 0.08f) : new Color(0.48f, 0.28f, 0.17f), new Vector2(-245, -44 - i * 74), new Vector2(60, 58), new Color(0.96f, 0.86f, 0.70f));
                Text lesson = MakeText(_learningRows, "Lesson" + i, lessons[i], 23, Ink, new Vector2(25, -44 - i * 74), new Vector2(430, 62));
                lesson.alignment = TextAnchor.MiddleLeft;
            }
            if (!string.IsNullOrWhiteSpace(feedback))
            {
                Text feedbackText = MakeText(_learningRows, "Feedback", feedback, 16, Muted, new Vector2(10, -270), new Vector2(500, 38));
                feedbackText.alignment = TextAnchor.MiddleLeft;
            }
        }

        private static int CountSafe(IList<bool> decisions)
        {
            int count = 0;
            for (int i = 0; i < decisions.Count; i++) if (decisions[i]) count++;
            return count;
        }

        private static string ReadyLabel(SimulationDefinition definition)
        {
            string title = definition != null ? definition.DisplayTitle ?? "" : "";
            if (title.IndexOf("flood", StringComparison.OrdinalIgnoreCase) >= 0) return "FLOOD READY!";
            if (title.IndexOf("fire", StringComparison.OrdinalIgnoreCase) >= 0) return "FIRE READY!";
            if (title.IndexOf("earthquake", StringComparison.OrdinalIgnoreCase) >= 0) return "QUAKE READY!";
            return "SAFETY READY!";
        }

        private static void ClearChildren(Transform parent)
        {
            for (int i = parent.childCount - 1; i >= 0; i--) Destroy(parent.GetChild(i).gameObject);
        }

        private void ReturnToStarter()
        {
            GameManager gm = GameLayoutManager.Get<GameManager>();
            if (gm != null) gm.ReturnToStarterScreen();
        }

        public void ShowNetworkFailure(string error, Action onRetry)
        {
            _mainContent.SetActive(false);
            _btnRetry.gameObject.SetActive(true);
            _onRetryClicked = onRetry;
            _titleText.text = "SUBMISSION FAILED";
            _subtitleText.text = "Communication Error";
            _scoreText.text = "";
            _statusText.text = $"{GameLayoutManager.TextNetworkErrorPrompt}\n{error}";
            _mainContent.SetActive(true);
            gameObject.SetActive(true);
        }

        public void DisplayLeaderboard(List<LeaderboardEntry> entries)
        {
            _leaderboardPanel.SetActive(true);
            if (entries == null || entries.Count == 0) { _leaderboardListText.text = "No records found on leaderboard yet."; return; }
            StringBuilder sb = new StringBuilder("RANK      AGENT                  TOTAL POINTS\n---------------------------------------------\n");
            for (int i = 0; i < entries.Count; i++)
            {
                LeaderboardEntry entry = entries[i];
                sb.AppendLine($"{i + 1,-8}  {(entry.username ?? "Anonymous"),-20}  {entry.totalPoints} pts");
            }
            _leaderboardListText.text = sb.ToString();
        }

        private void PlayClickSound()
        {
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null) audio.PlaySound(GameLayoutManager.PathAudioClick);
        }
    }
}
