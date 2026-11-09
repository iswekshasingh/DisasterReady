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
        [JsonProperty("username")]
        public string username;

        [JsonProperty("password")]
        public string password;
    }

    [Serializable]
    public class UserDto
    {
        [JsonProperty("id")]
        public string id;

        [JsonProperty("username")]
        public string username;

        [JsonProperty("email")]
        public string email;
    }

    [Serializable]
    public class AuthResponse
    {
        [JsonProperty("token")]
        public string token;

        [JsonProperty("jwt")]
        public string jwt;

        [JsonProperty("user")]
        public UserDto user;

        public string GetToken() => !string.IsNullOrEmpty(token) ? token : jwt;
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

        public string GetId() => !string.IsNullOrEmpty(id) ? id : mongoId;
    }

    [Serializable]
    public class OptionItem
    {
        [JsonProperty("id")]
        public string id;

        [JsonProperty("label")]
        public string label;

        [JsonProperty("text")]
        public string text;

        public string GetLabel() => !string.IsNullOrEmpty(label) ? label : text;
    }

    [Serializable]
    public class QuestionItem
    {
        [JsonProperty("id")]
        public string id;

        [JsonProperty("prompt")]
        public string prompt;

        [JsonProperty("options")]
        public List<OptionItem> options = new List<OptionItem>();
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

        [JsonProperty("questions")]
        public List<QuestionItem> questions = new List<QuestionItem>();

        public string GetId() => !string.IsNullOrEmpty(id) ? id : mongoId;
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
        [JsonProperty("score")]
        public int score;

        [JsonProperty("passed")]
        public bool passed;

        [JsonProperty("points")]
        public int points;

        [JsonProperty("aiFeedback")]
        public string aiFeedback;

        [JsonProperty("feedback")]
        public string feedback;

        [JsonProperty("id")]
        public string id;
    }

    // ==========================================
    // Leaderboard DTOs
    // ==========================================
    [Serializable]
    public class LeaderboardEntry
    {
        [JsonProperty("username")]
        public string username;

        [JsonProperty("score")]
        public int score;

        [JsonProperty("points")]
        public int points;

        [JsonProperty("createdAt")]
        public string createdAt;
    }
}

