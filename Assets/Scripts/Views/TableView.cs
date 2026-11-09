using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Renders the sturdy table where the character can take cover.
    /// Table is sorted in front of the character (SortingOrderTable = 10) so the character hides under it.
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer))]
    public class TableView : MonoBehaviour
    {
        private SpriteRenderer _renderer;

        private void Awake()
        {
            _renderer = GetComponent<SpriteRenderer>();
            GameLayoutManager.Register(this);
        }

        private void Start()
        {
            transform.position = GameLayoutManager.TablePosition;
            _renderer.sortingOrder = GameLayoutManager.SortingOrderTable;

            Sprite sprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteTable,
                GameLayoutManager.TableSize,
                new Color(0.55f, 0.32f, 0.16f, 1f),
                "table"
            );
            _renderer.sprite = sprite;

            if (sprite != null && sprite.rect.height > 0)
            {
                float spriteW = sprite.rect.width / sprite.pixelsPerUnit;
                float spriteH = sprite.rect.height / sprite.pixelsPerUnit;
                transform.localScale = new Vector3(
                    GameLayoutManager.TableSize.x / spriteW,
                    GameLayoutManager.TableSize.y / spriteH,
                    1f
                );
            }
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<TableView>();
        }
    }
}

