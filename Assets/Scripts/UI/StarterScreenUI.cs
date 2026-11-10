using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using DisasterSurvival.Core;
using DisasterSurvival.Audio;
using DisasterSurvival.Scenario;
using DisasterSurvival.Character;

namespace DisasterSurvival.UI
{
    /// <summary>
    /// Starter Screen displayed before entering simulations.
    /// Dynamically lists all registered simulations from SimulationRegistry (Earthquake, Fire, etc.)
    /// allowing players to select and launch any simulation directly.
    /// </summary>
    public class StarterScreenUI : MonoBehaviour
    {
        private Action<int> _onSimulationSelected;
        private GameObject _cardsContainer;
        private readonly List<GameObject> _createdCards = new List<GameObject>();

        private void Awake()
        {
            GameLayoutManager.Register(this);
            BuildStaticLayout();
            gameObject.SetActive(false);
        }

        private void OnDestroy()
        {
            GameLayoutManager.Unregister<StarterScreenUI>();
        }

        private void BuildStaticLayout()
        {
            RectTransform rt = UIHelper.EnsureRectTransform(gameObject);
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            // Fullscreen backdrop
            Image bg = gameObject.AddComponent<Image>();
            bg.sprite = UIHelper.CreateWhiteSprite();
            bg.color = GameLayoutManager.StarterBgColor;
            bg.raycastTarget = true;

            // Title Container
            GameObject titleObj = new GameObject("HeaderContainer");
            titleObj.transform.SetParent(transform, false);
            RectTransform titleRt = UIHelper.EnsureRectTransform(titleObj);
            titleRt.anchorMin = new Vector2(0.5f, 1f);
            titleRt.anchorMax = new Vector2(0.5f, 1f);
            titleRt.pivot = new Vector2(0.5f, 1f);
            titleRt.anchoredPosition = new Vector2(0f, -80f);
            titleRt.sizeDelta = new Vector2(1600f, 160f);

            // Title Text
            Text title = UIHelper.CreateText(
                titleObj,
                "Title",
                GameLayoutManager.TextStarterTitle,
                52,
                new Color(1f, 0.95f, 0.35f, 1f),
                TextAnchor.MiddleCenter
            );
            RectTransform titleTextRt = title.GetComponent<RectTransform>();
            titleTextRt.anchoredPosition = new Vector2(0f, 25f);

            // Subtitle Text
            Text subtitle = UIHelper.CreateText(
                titleObj,
                "Subtitle",
                GameLayoutManager.TextStarterSubtitle,
                22,
                new Color(0.75f, 0.82f, 0.92f, 1f),
                TextAnchor.MiddleCenter
            );
            RectTransform subTextRt = subtitle.GetComponent<RectTransform>();
            subTextRt.anchoredPosition = new Vector2(0f, -30f);

            // Cards Container (centered horizontally & vertically in available area)
            _cardsContainer = new GameObject("CardsContainer");
            _cardsContainer.transform.SetParent(transform, false);
            RectTransform cardsRt = UIHelper.EnsureRectTransform(_cardsContainer);
            cardsRt.anchorMin = new Vector2(0.5f, 0.5f);
            cardsRt.anchorMax = new Vector2(0.5f, 0.5f);
            cardsRt.pivot = new Vector2(0.5f, 0.5f);
            cardsRt.anchoredPosition = new Vector2(0f, -40f);
            cardsRt.sizeDelta = new Vector2(1600f, 520f);
        }

        public void Show(Action<int> onSelectSimulation)
        {
            _onSimulationSelected = onSelectSimulation;
            gameObject.SetActive(true);

            // Hide in-game HUD & Character while on Starter Screen
            BannerUI banner = GameLayoutManager.Get<BannerUI>();
            if (banner != null) banner.Hide();

            DecisionUI decision = GameLayoutManager.Get<DecisionUI>();
            if (decision != null)
            {
                decision.ClearButtons();
                decision.gameObject.SetActive(false);
            }

            SimulationIndicatorUI indicator = GameLayoutManager.Get<SimulationIndicatorUI>();
            if (indicator != null) indicator.Hide();

            CharacterController2D character = GameLayoutManager.Get<CharacterController2D>();
            if (character != null) character.gameObject.SetActive(false);

            PopulateSimulationCards();
        }

        public void Hide()
        {
            gameObject.SetActive(false);
        }

        private void PopulateSimulationCards()
        {
            // Clear existing card objects
            for (int i = 0; i < _createdCards.Count; i++)
            {
                if (_createdCards[i] != null)
                {
                    Destroy(_createdCards[i]);
                }
            }
            _createdCards.Clear();

            IReadOnlyList<SimulationDefinition> sims = SimulationRegistry.All;
            if (sims == null || sims.Count == 0) return;

            int count = sims.Count;
            Vector2 cardSize = GameLayoutManager.StarterCardSize;
            float spacing = GameLayoutManager.StarterCardSpacing;

            float totalWidth = count * cardSize.x + (count - 1) * spacing;
            float startX = -totalWidth * 0.5f + cardSize.x * 0.5f;

            for (int i = 0; i < count; i++)
            {
                int simIndex = i;
                SimulationDefinition def = sims[i];

                Vector2 cardPos = new Vector2(startX + i * (cardSize.x + spacing), 0f);
                GameObject card = CreateCard(def, simIndex, cardPos, cardSize);
                _createdCards.Add(card);
            }
        }

        private GameObject CreateCard(SimulationDefinition def, int index, Vector2 anchoredPos, Vector2 size)
        {
            GameObject cardObj = new GameObject($"Card_{def.SimulationKey}");
            cardObj.transform.SetParent(_cardsContainer.transform, false);

            RectTransform cardRt = UIHelper.EnsureRectTransform(cardObj);
            cardRt.sizeDelta = size;
            cardRt.anchoredPosition = anchoredPos;

            // 1. Card Background
            Image bg = cardObj.AddComponent<Image>();
            bg.sprite = UIHelper.CreateWhiteSprite();
            bg.color = GameLayoutManager.StarterCardBgColor;

            // 2. Top Accent Stripe
            GameObject stripe = new GameObject("AccentStripe");
            stripe.transform.SetParent(cardObj.transform, false);
            Image stripeImg = stripe.AddComponent<Image>();
            stripeImg.sprite = UIHelper.CreateWhiteSprite();
            stripeImg.color = def.AccentColor;
            RectTransform stripeRt = stripe.GetComponent<RectTransform>();
            stripeRt.anchorMin = new Vector2(0f, 1f);
            stripeRt.anchorMax = new Vector2(1f, 1f);
            stripeRt.pivot = new Vector2(0.5f, 1f);
            stripeRt.sizeDelta = new Vector2(0f, 8f);
            stripeRt.anchoredPosition = Vector2.zero;

            // 3. Badge Pill
            GameObject badgeObj = new GameObject("BadgePill");
            badgeObj.transform.SetParent(cardObj.transform, false);
            Image badgeImg = badgeObj.AddComponent<Image>();
            badgeImg.sprite = UIHelper.CreateWhiteSprite();
            badgeImg.color = new Color(def.AccentColor.r, def.AccentColor.g, def.AccentColor.b, 0.25f);
            RectTransform badgeRt = badgeObj.GetComponent<RectTransform>();
            badgeRt.anchorMin = new Vector2(0.5f, 1f);
            badgeRt.anchorMax = new Vector2(0.5f, 1f);
            badgeRt.pivot = new Vector2(0.5f, 1f);
            badgeRt.anchoredPosition = new Vector2(0f, -30f);
            badgeRt.sizeDelta = new Vector2(170f, 34f);

            Text badgeText = UIHelper.CreateText(
                badgeObj,
                "BadgeText",
                def.BadgeText ?? $"SIMULATION {index + 1}",
                16,
                def.AccentColor,
                TextAnchor.MiddleCenter
            );

            // 4. Title
            GameObject titleObj = new GameObject("TitleText");
            titleObj.transform.SetParent(cardObj.transform, false);
            RectTransform titleRt = UIHelper.EnsureRectTransform(titleObj);
            titleRt.anchorMin = new Vector2(0.5f, 1f);
            titleRt.anchorMax = new Vector2(0.5f, 1f);
            titleRt.pivot = new Vector2(0.5f, 1f);
            titleRt.anchoredPosition = new Vector2(0f, -85f);
            titleRt.sizeDelta = new Vector2(size.x - 40f, 90f);

            Text titleText = UIHelper.CreateText(
                titleObj,
                "Text",
                def.DisplayTitle,
                24,
                Color.white,
                TextAnchor.MiddleCenter
            );

            // 5. Divider Line
            GameObject div = new GameObject("Divider");
            div.transform.SetParent(cardObj.transform, false);
            Image divImg = div.AddComponent<Image>();
            divImg.sprite = UIHelper.CreateWhiteSprite();
            divImg.color = new Color(1f, 1f, 1f, 0.12f);
            RectTransform divRt = div.GetComponent<RectTransform>();
            divRt.anchorMin = new Vector2(0.5f, 1f);
            divRt.anchorMax = new Vector2(0.5f, 1f);
            divRt.pivot = new Vector2(0.5f, 1f);
            divRt.sizeDelta = new Vector2(size.x - 60f, 2f);
            divRt.anchoredPosition = new Vector2(0f, -185f);

            // 6. Description Text
            GameObject descObj = new GameObject("DescText");
            descObj.transform.SetParent(cardObj.transform, false);
            RectTransform descRt = UIHelper.EnsureRectTransform(descObj);
            descRt.anchorMin = new Vector2(0.5f, 1f);
            descRt.anchorMax = new Vector2(0.5f, 1f);
            descRt.pivot = new Vector2(0.5f, 1f);
            descRt.anchoredPosition = new Vector2(0f, -205f);
            descRt.sizeDelta = new Vector2(size.x - 50f, 130f);

            Text descText = UIHelper.CreateText(
                descObj,
                "Text",
                def.Description ?? def.IntroText ?? "Complete emergency survival decisions.",
                18,
                new Color(0.78f, 0.83f, 0.90f, 1f),
                TextAnchor.UpperCenter
            );

            // 7. Launch Button
            Button launchBtn = UIHelper.CreateStyledButton(
                cardObj,
                "LaunchBtn",
                GameLayoutManager.TextLaunchSimulation,
                new Vector2(size.x - 60f, 65f),
                def.AccentColor,
                Color.white,
                20,
                () => OnCardClicked(index)
            );

            RectTransform btnRt = launchBtn.GetComponent<RectTransform>();
            btnRt.anchorMin = new Vector2(0.5f, 0f);
            btnRt.anchorMax = new Vector2(0.5f, 0f);
            btnRt.pivot = new Vector2(0.5f, 0f);
            btnRt.anchoredPosition = new Vector2(0f, 25f);

            return cardObj;
        }

        private void OnCardClicked(int simulationIndex)
        {
            AudioManager audio = GameLayoutManager.Get<AudioManager>();
            if (audio != null)
            {
                audio.PlaySound(GameLayoutManager.PathAudioClick);
            }

            _onSimulationSelected?.Invoke(simulationIndex);
        }
    }
}

