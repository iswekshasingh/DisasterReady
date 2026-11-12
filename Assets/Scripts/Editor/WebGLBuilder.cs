#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace DisasterReady.Editor
{
    public static class WebGLBuilder
    {
        private const string ScenePath = "Assets/Scenes/SampleScene.unity";
        private const string OutputDirectory = "frontend/public/unity/earthquake";

        [MenuItem("DisasterReady/Build WebGL for React Portal")]
        public static void BuildWebGLMenu()
        {
            BuildWebGLExternal();
        }

        public static void BuildWebGLExternal()
        {
            Debug.Log("[WebGLBuilder] Starting DisasterReady WebGL build for React portal...");

            // 1. Ensure output directory exists and is clean
            string projectRoot = Directory.GetCurrentDirectory();
            string fullOutputPath = Path.Combine(projectRoot, OutputDirectory);

            if (!Directory.Exists(fullOutputPath))
            {
                Directory.CreateDirectory(fullOutputPath);
            }

            // 2. Configure PlayerSettings for WebGL
            PlayerSettings.defaultWebScreenWidth = 1920;
            PlayerSettings.defaultWebScreenHeight = 1080;
            PlayerSettings.runInBackground = true;

            // Use uncompressed WebGL for instant local development streaming without server MIME issues
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            PlayerSettings.WebGL.decompressionFallback = true;

            // 3. Setup Build Player Options
            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = fullOutputPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };

            Debug.Log($"[WebGLBuilder] Building scene '{ScenePath}' to '{fullOutputPath}'...");

            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            BuildSummary summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"[WebGLBuilder] WebGL build succeeded! Output: {summary.totalSize / 1024 / 1024:F2} MB in {summary.totalTime.TotalSeconds:F1}s.");
                Debug.Log($"[WebGLBuilder] Files saved to: {fullOutputPath}");
            }
            else
            {
                Debug.LogError($"[WebGLBuilder] WebGL build failed with result: {summary.result}. Errors: {summary.totalErrors}");
                foreach (BuildStep step in report.steps)
                {
                    foreach (BuildStepMessage message in step.messages)
                    {
                        if (message.type == LogType.Error || message.type == LogType.Exception)
                        {
                            Debug.LogError($"[WebGLBuilder Error] {message.content}");
                        }
                    }
                }
            }
        }
    }
}
#endif

