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
        private AudioSource _sfxSource;
        private AudioSource _loopSource;
        private readonly Dictionary<string, AudioClip> _clipCache = new Dictionary<string, AudioClip>();

        private void Awake()
        {
            _sfxSource = gameObject.AddComponent<AudioSource>();
            _sfxSource.playOnAwake = false;

            _loopSource = gameObject.AddComponent<AudioSource>();
            _loopSource.playOnAwake = false;
            _loopSource.loop = true;

            GameLayoutManager.Register(this);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<AudioManager>();
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
            AudioClip clip = GetOrLoadClip(resourcePath);
            if (clip != null && _sfxSource != null)
            {
                _sfxSource.PlayOneShot(clip);
            }
        }

        public void PlayLoop(string resourcePath)
        {
            AudioClip clip = GetOrLoadClip(resourcePath);
            if (clip != null && _loopSource != null)
            {
                _loopSource.clip = clip;
                _loopSource.Play();
            }
        }

        public void StopLoop()
        {
            if (_loopSource != null && _loopSource.isPlaying)
            {
                _loopSource.Stop();
                _loopSource.clip = null;
            }
        }
    }
}

