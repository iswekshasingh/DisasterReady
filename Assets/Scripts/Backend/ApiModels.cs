
using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace DisasterSurvival.Backend
{
    // ==========================================
    // Authentication DTOs
    // ==========================================

    [Serializable]
    public class RegisterRequest
    {
        [JsonProperty("username")]
        public string username;

        [JsonProperty("password")]
        public string password;

        [JsonProperty("email")]
        public string email;
    }

    [Serializable]
    public class LoginRequest
    {
        [JsonProperty("email")]
        public string email;

        [JsonProperty("password")]
        public string password;
    }

    [Serializable]
    public class UserDto
    {
        [JsonProperty("id")]
        public string id;

        [JsonProperty("userId")]
        public string userId;

        [JsonProperty("username")]
        public string username;

        [JsonProperty("email")]
        public string email;

        [JsonProperty("role")]
        public string role;

        public string GetId() =>
            !string.IsNullOrEmpty(id) ? id : userId;
    }

    [Serializable]
    public class AuthResponse
    {
        [JsonProperty("success")]
        public bool success;

        [JsonProperty("message")]
        public string message;

        [JsonProperty("token")]
        public string token;

        [JsonProperty("jwt")]
        public string jwt;

        [JsonProperty("user")]
        public UserDto user;

        public string GetToken() =>
            !string.IsNullOrEmpty(token) ? token : jwt;
    }

    [Serializable]
    public class MeResponse
    {
        [JsonProperty("success")]
        public bool success;

        [JsonProperty("user")]
        public UserDto user;
    }

    // ==========================================
    // Scenario DTOs
    // ==========================================

    [Serializable]
    public class ScenarioItem
    {
        [JsonProperty("id")]
        public string id;

        [JsonProperty("_id")]
        public string mongoId;

        [JsonProperty("title")]
        public string title;

        [JsonProperty("description")]
        public string description;

        [JsonProperty("disasterType")]
        public string disasterType;

        [JsonProperty("difficulty")]
        public string difficulty;

        [JsonProperty("estimatedDuration")]
        public int estimatedDuration;

        [JsonProperty("passingScore")]
        public int passingScore;

        [JsonProperty("maxScore")]
        public int maxScore;

        public string GetId() =>
            !string.IsNullOrEmpty(id) ? id : mongoId;
    }

    [Serializable]
    public class ScenariosResponse
    {
        [JsonProperty("success")]
        public bool success;

        [JsonProperty("count")]
        public int count;

        [JsonProperty("scenarios")]
        public List<ScenarioItem> scenarios;
    }

    [Serializable]
    public class OptionItem
    {
        [JsonProperty("optionId")]
        public string id;

        [JsonProperty("text")]
        public string label;

        public string GetLabel() => label;
    }

    [Serializable]
    public class QuestionItem
    {
        [JsonProperty("questionId")]
        public string id;

        [JsonProperty("question")]
        public string prompt;

        [JsonProperty("options")]
        public List<OptionItem> options = new List<OptionItem>();

        [JsonProperty("points")]
        public int points;
    }

    [Serializable]
    public class ScenarioDetail
    {
        [JsonProperty("id")]
        public string id;

        [JsonProperty("_id")]
        public string mongoId;

        [JsonProperty("title")]
        public string title;

        [JsonProperty("description")]
        public string description;

        [JsonProperty("disasterType")]
        public string disasterType;

        [JsonProperty("difficulty")]
        public string difficulty;

        [JsonProperty("estimatedDuration")]
        public int estimatedDuration;

        [JsonProperty("passingScore")]
        public int passingScore;

        [JsonProperty("maxScore")]
        public int maxScore;

        [JsonProperty("instructions")]
        public string instructions;

        [JsonProperty("questions")]
        public List<QuestionItem> questions = new List<QuestionItem>();

        public string GetId() =>
            !string.IsNullOrEmpty(id) ? id : mongoId;
    }

    [Serializable]
    public class ScenarioDetailResponse
    {
        [JsonProperty("success")]
        public bool success;

        [JsonProperty("scenario")]
        public ScenarioDetail scenario;
    }

    // ==========================================
    // Attempt Submission DTOs
    // ==========================================

    [Serializable]
    public class AnswerSubmission
    {
        [JsonProperty("questionId")]
        public string questionId;

        [JsonProperty("selectedOptionId")]
        public string selectedOptionId;

        public AnswerSubmission() { }

        public AnswerSubmission(string questionId, string selectedOptionId)
        {
            this.questionId = questionId;
            this.selectedOptionId = selectedOptionId;
        }
    }

    [Serializable]
    public class AttemptSubmissionRequest
    {
        [JsonProperty("scenarioId")]
        public string scenarioId;

        [JsonProperty("answers")]
        public List<AnswerSubmission> answers = new List<AnswerSubmission>();

        [JsonProperty("timeSpent")]
        public int timeSpent;
    }

    [Serializable]
    public class AttemptResultResponse
    {
        [JsonProperty("id")]
        public string id;

        [JsonProperty("scenarioId")]
        public string scenarioId;

        [JsonProperty("score")]
        public int score;

        [JsonProperty("maxScore")]
        public int maxScore;

        [JsonProperty("correctAnswers")]
        public int correctAnswers;

        [JsonProperty("totalQuestions")]
        public int totalQuestions;

        [JsonProperty("passed")]
        public bool passed;

        [JsonProperty("results")]
        public List<QuestionResult> results = new List<QuestionResult>();

        [JsonProperty("feedback")]
        public string feedback;
    }

    [Serializable]
    public class QuestionResult
    {
        [JsonProperty("questionId")]
        public string questionId;

        [JsonProperty("selectedOptionId")]
        public string selectedOptionId;

        [JsonProperty("correctOptionId")]
        public string correctOptionId;

        [JsonProperty("correct")]
        public bool correct;

        [JsonProperty("pointsEarned")]
        public int pointsEarned;

        [JsonProperty("explanation")]
        public string explanation;
    }

    [Serializable]
    public class AttemptSubmissionResponse
    {
        [JsonProperty("success")]
        public bool success;

        [JsonProperty("message")]
        public string message;

        [JsonProperty("attempt")]
        public AttemptResultResponse attempt;
    }

    // ==========================================
    // Leaderboard DTOs
    // ==========================================

    [Serializable]
    public class LeaderboardEntry
    {
        [JsonProperty("rank")]
        public int rank;

        [JsonProperty("id")]
        public string id;

        [JsonProperty("username")]
        public string username;

        [JsonProperty("fullName")]
        public string fullName;

        [JsonProperty("totalPoints")]
        public int totalPoints;

        [JsonProperty("level")]
        public int level;

        [JsonProperty("badges")]
        public List<string> badges = new List<string>();
    }

    [Serializable]
    public class LeaderboardResponse
    {
        [JsonProperty("success")]
        public bool success;

        [JsonProperty("count")]
        public int count;

        [JsonProperty("leaderboard")]
        public List<LeaderboardEntry> leaderboard;
    }
}
