using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Renders the room background sprite or procedural placeholder.
    /// Supports switching between normal room and earthquake-damaged room.
    /// Automatically fits to the camera viewport regardless of texture aspect ratio.
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer))]
    public class BackgroundView : MonoBehaviour
    {
        private SpriteRenderer _renderer;
        private Sprite _spriteNormal;
        private Sprite _spriteDamaged;

        private void Awake()
        {
            _renderer = GetComponent<SpriteRenderer>();
            GameLayoutManager.Register(this);
            LoadSprites();
        }

        private void Start()
        {
            transform.position = GameLayoutManager.BackgroundPosition;
            _renderer.sortingOrder = GameLayoutManager.SortingOrderBackground;
            SetNormal();
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<BackgroundView>();
        }

        private void LoadSprites()
        {
            _spriteNormal = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteBackground,
                GameLayoutManager.BackgroundSize,
                new Color(0.24f, 0.28f, 0.36f, 1f),
                "background"
            );

            _spriteDamaged = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteBackgroundDamaged,
                GameLayoutManager.BackgroundSize,
                new Color(0.2f, 0.22f, 0.28f, 1f),
                "background"
            );
        }

        public void SetNormal()
        {
            if (_renderer != null && _spriteNormal != null)
            {
                _renderer.sprite = _spriteNormal;
                FitToCamera();
            }
        }

        public void SetDamaged()
        {
            if (_renderer != null)
            {
                _renderer.sprite = _spriteDamaged != null ? _spriteDamaged : _spriteNormal;
                FitToCamera();
            }
        }

        private void FitToCamera()
        {
            if (_renderer == null || _renderer.sprite == null) return;

            float spriteWidth = _renderer.sprite.rect.width / _renderer.sprite.pixelsPerUnit;
            float spriteHeight = _renderer.sprite.rect.height / _renderer.sprite.pixelsPerUnit;

            if (spriteWidth <= 0 || spriteHeight <= 0) return;

            // Camera bounds in world units
            float cameraHeight = GameLayoutManager.OrthographicSize * 2f;
            float cameraWidth = cameraHeight * (GameLayoutManager.ReferenceResolution.x / GameLayoutManager.ReferenceResolution.y);

            // Scale to fill the camera view
            float scaleX = cameraWidth / spriteWidth;
            float scaleY = cameraHeight / spriteHeight;
            float scale = Mathf.Max(scaleX, scaleY);

            transform.localScale = new Vector3(scale, scale, 1f);
        }
    }
}
