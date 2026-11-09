using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Renders the exit door at the far right of the room.
    /// If the background room sprite already includes a door, suppresses the procedural placeholder.
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer))]
    public class DoorView : MonoBehaviour
    {
        private SpriteRenderer _renderer;

        private void Awake()
        {
            _renderer = GetComponent<SpriteRenderer>();
        }

        private void Start()
        {
            transform.position = GameLayoutManager.DoorPosition;
            _renderer.sortingOrder = GameLayoutManager.SortingOrderDoor;

            // Only show door sprite if a dedicated door asset is provided in Resources
            Sprite sprite = Resources.Load<Sprite>(GameLayoutManager.PathSpriteDoor);
            if (sprite != null)
            {
                _renderer.sprite = sprite;
                _renderer.enabled = true;
            }
            else
            {
                // The room background art already has the door painted; suppress dummy door
                _renderer.enabled = false;
            }
        }
    }
}
