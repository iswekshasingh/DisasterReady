using System.Collections.Generic;
using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Audio
{
    /// <summary>
    /// Null-safe audio manager that loads clips from Resources dynamically.
    /// Safely ignores missing audio assets so the game always runs smoothly with zero errors.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        private AudioSource _loopSource;
        private readonly Dictionary<string, AudioClip> _clipCache = new Dictionary<string, AudioClip>();
        private readonly Dictionary<string, AudioSource> _activeSfxSources = new Dictionary<string, AudioSource>();

        private void Awake()
        {
            _loopSource = gameObject.AddComponent<AudioSource>();
            _loopSource.playOnAwake = false;
            _loopSource.loop = true;
            _loopSource.volume = 0.75f;

            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            StopAllAudio();
            GameLayoutManager.Unregister<AudioManager>();
        }

        private void OnApplicationQuit()
        {
            StopAllAudio();
        }

        private AudioClip GetOrLoadClip(string resourcePath)
        {
            if (string.IsNullOrEmpty(resourcePath)) return null;

            if (_clipCache.TryGetValue(resourcePath, out AudioClip cached))
            {
                return cached;
            }

            AudioClip loaded = Resources.Load<AudioClip>(resourcePath);
            _clipCache[resourcePath] = loaded; // Can be null if file not present; cached to avoid repeated disk checks
            return loaded;
        }

        public void PlaySound(string resourcePath)
        {
            AudioListener.pause = false;
            AudioClip clip = GetOrLoadClip(resourcePath);
            if (clip == null) return;

            // Give each named effect its own source so a long clip can be stopped without
            // cutting off overlapping sounds such as water and drowning audio.
            StopSound(resourcePath);
            AudioSource source = gameObject.AddComponent<AudioSource>();
            source.playOnAwake = false;
            source.loop = false;
            source.volume = 1f;
            source.clip = clip;
            _activeSfxSources[resourcePath] = source;
            source.Play();
        }

        public void StopSound(string resourcePath)
        {
            if (string.IsNullOrEmpty(resourcePath) || !_activeSfxSources.TryGetValue(resourcePath, out AudioSource source)) return;
            _activeSfxSources.Remove(resourcePath);
            if (source != null)
            {
                source.Stop();
                Destroy(source);
            }
        }

        public void StopAllSounds()
        {
            if (_activeSfxSources.Count == 0) return;
            var paths = new List<string>(_activeSfxSources.Keys);
            foreach (string path in paths) StopSound(path);
        }

        public void StopAllAudio()
        {
            StopLoop();
            StopAllSounds();
        }

        public void PlayLoop(string resourcePath, float volume = 0.75f)
        {
            AudioListener.pause = false;
            AudioClip clip = GetOrLoadClip(resourcePath);
            if (clip != null && _loopSource != null)
            {
                if (_loopSource.isPlaying && _loopSource.clip == clip)
                {
                    return;
                }
                _loopSource.clip = clip;
                _loopSource.volume = Mathf.Clamp01(volume);
                _loopSource.Play();
            }
        }

        public void StopLoop()
        {
            if (_loopSource != null)
            {
                _loopSource.Stop();
                _loopSource.clip = null;
            }
        }
    }
}

