using System;
using System.Collections;
using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Displays exit pathways in the corridor during fire evacuation:
    /// Illuminated EXIT sign, emergency stairs route, and elevator doors with emergency prohibition marker.
    /// </summary>
    public class ExitRouteView : MonoBehaviour
    {
        private GameObject _exitSignObj;
        private GameObject _stairsObj;
        private GameObject _elevatorObj;
        private SpriteRenderer _elevatorRenderer;
        private Coroutine _elevatorFailRoutine;

        private void Awake()
        {
            SetupStairs();
            SetupElevator();
            SetupExitSign();
        }

        private void SetupExitSign()
        {
            _exitSignObj = new GameObject("ExitSign");
            _exitSignObj.transform.SetParent(transform);
            _exitSignObj.transform.position = GameLayoutManager.ExitSignPosition;

            SpriteRenderer sr = _exitSignObj.AddComponent<SpriteRenderer>();
            sr.sortingOrder = GameLayoutManager.SortingOrderFireRouteProps;
            Sprite sprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireExitSign,
                GameLayoutManager.ExitSignSize,
                new Color(0.15f, 0.85f, 0.35f, 1f),
                "exit_sign"
            );
            sr.sprite = sprite;
            FitScale(_exitSignObj, sprite, GameLayoutManager.ExitSignSize);
        }

        private void SetupStairs()
        {
            _stairsObj = new GameObject("StairsRoute");
            _stairsObj.transform.SetParent(transform);
            _stairsObj.transform.position = GameLayoutManager.StairsPosition;

            SpriteRenderer sr = _stairsObj.AddComponent<SpriteRenderer>();
            sr.sortingOrder = GameLayoutManager.SortingOrderFireRouteProps;
            Sprite sprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireStairs,
                GameLayoutManager.StairsSize,
                new Color(0.4f, 0.45f, 0.5f, 1f),
                "stairs"
            );
            sr.sprite = sprite;
            FitScale(_stairsObj, sprite, GameLayoutManager.StairsSize);
        }

        private void SetupElevator()
        {
            _elevatorObj = new GameObject("ElevatorRoute");
            _elevatorObj.transform.SetParent(transform);
            _elevatorObj.transform.position = GameLayoutManager.ElevatorPosition;

            _elevatorRenderer = _elevatorObj.AddComponent<SpriteRenderer>();
            _elevatorRenderer.sortingOrder = GameLayoutManager.SortingOrderFireRouteProps;
            Sprite sprite = SpriteHelper.LoadOrCreate(
                GameLayoutManager.PathSpriteFireElevatorDoor,
                GameLayoutManager.ElevatorSize,
                new Color(0.55f, 0.58f, 0.62f, 1f),
                "elevator_door"
            );
            _elevatorRenderer.sprite = sprite;
            FitScale(_elevatorObj, sprite, GameLayoutManager.ElevatorSize);
        }

        private void FitScale(GameObject target, Sprite sprite, Vector2 worldSize)
        {
            if (sprite != null && sprite.rect.height > 0)
            {
                float w = sprite.rect.width / sprite.pixelsPerUnit;
                float h = sprite.rect.height / sprite.pixelsPerUnit;
                target.transform.localScale = new Vector3(
                    worldSize.x / w,
                    worldSize.y / h,
                    1f
                );
            }
        }

        public void TriggerElevatorFail(Action onComplete = null)
        {
            if (_elevatorFailRoutine != null) StopCoroutine(_elevatorFailRoutine);
            _elevatorFailRoutine = StartCoroutine(ElevatorFailRoutine(onComplete));
        }

        private IEnumerator ElevatorFailRoutine(Action onComplete)
        {
            Color origColor = _elevatorRenderer.color;
            // Red warning flashes on elevator call failure
            for (int i = 0; i < 4; i++)
            {
                _elevatorRenderer.color = new Color(1f, 0.2f, 0.2f, 1f);
                yield return new WaitForSeconds(0.15f);
                _elevatorRenderer.color = origColor;
                yield return new WaitForSeconds(0.15f);
            }
            onComplete?.Invoke();
        }

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
        }

        private void OnDestroy()
        {
            StopAllCoroutines();
        }
    }
}

