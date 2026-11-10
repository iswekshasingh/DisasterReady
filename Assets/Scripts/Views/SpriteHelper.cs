using System.Collections.Generic;
using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Views
{
    /// <summary>
    /// Loads sprites from Resources or generates clear, visually distinct pixel-art placeholders.
    /// Ensures the game runs and looks great even before art assets are added.
    /// </summary>
    public static class SpriteHelper
    {
        private static readonly Dictionary<string, Sprite> _cache = new Dictionary<string, Sprite>();

        public static Sprite LoadOrCreate(string resourcePath, Vector2 worldSize, Color baseColor, string placeholderType)
        {
            if (_cache.TryGetValue(resourcePath, out Sprite cached) && cached != null)
            {
                return cached;
            }

            // Attempt to load provided PNG from Resources
            Sprite loaded = Resources.Load<Sprite>(resourcePath);
            if (loaded != null)
            {
                _cache[resourcePath] = loaded;
                return loaded;
            }

            // Generate procedural placeholder sized using layout config and PPU
            int width = Mathf.Max(8, Mathf.RoundToInt(worldSize.x * GameLayoutManager.PixelsPerUnit));
            int height = Mathf.Max(8, Mathf.RoundToInt(worldSize.y * GameLayoutManager.PixelsPerUnit));

            Texture2D texture = GenerateProceduralTexture(width, height, baseColor, placeholderType);
            texture.filterMode = FilterMode.Point;
            texture.wrapMode = TextureWrapMode.Clamp;

            Sprite created = Sprite.Create(
                texture,
                new Rect(0, 0, width, height),
                new Vector2(0.5f, 0.5f),
                GameLayoutManager.PixelsPerUnit
            );
            created.name = "Placeholder_" + placeholderType;

            _cache[resourcePath] = created;
            return created;
        }

        private static Texture2D GenerateProceduralTexture(int width, int height, Color baseColor, string type)
        {
            Texture2D tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            Color[] pixels = new Color[width * height];

            Color borderColor = baseColor * 0.7f;
            borderColor.a = 1f;

            Color highlightColor = Color.Lerp(baseColor, Color.white, 0.25f);
            highlightColor.a = 1f;

            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int idx = y * width + x;
                    bool isBorder = (x == 0 || x == width - 1 || y == 0 || y == height - 1);

                    switch (type)
                    {
                        case "background":
                            // Cozy room: warm wallpaper at top 75%, floorboards at bottom 25%
                            int floorH = height / 4;
                            if (y < floorH)
                            {
                                Color floorBase = new Color(0.35f, 0.22f, 0.12f, 1f); // Wood floor
                                bool floorPlank = (y % 16 == 0);
                                pixels[idx] = floorPlank ? floorBase * 0.7f : floorBase;
                            }
                            else if (y == floorH)
                            {
                                pixels[idx] = new Color(0.2f, 0.12f, 0.05f, 1f); // Skirting board
                            }
                            else
                            {
                                Color wallColor = new Color(0.22f, 0.28f, 0.35f, 1f); // Muted slate teal wall
                                bool stripe = ((x / 16) % 2 == 0);
                                pixels[idx] = stripe ? wallColor : wallColor * 0.95f;
                            }
                            break;

                        case "table":
                            // Sturdy wooden table: top tabletop with 2 thick legs
                            int topThick = Mathf.Max(4, height / 3);
                            int legWidth = Mathf.Max(3, width / 6);
                            bool isTop = y >= height - topThick;
                            bool isLeftLeg = x < legWidth && y < height - topThick;
                            bool isRightLeg = x >= width - legWidth && y < height - topThick;

                            if (isTop || isLeftLeg || isRightLeg)
                            {
                                bool edge = isBorder || y == height - topThick;
                                pixels[idx] = edge ? borderColor : baseColor;
                            }
                            else
                            {
                                pixels[idx] = Color.clear; // Open hollow area under table for hiding!
                            }
                            break;

                        case "debris":
                            // Jagged concrete chunk
                            int distFromCenter = Mathf.Abs(x - width / 2) + Mathf.Abs(y - height / 2);
                            int maxDist = (width + height) / 3;
                            if (distFromCenter < maxDist)
                            {
                                bool noisy = ((x * 7 + y * 13) % 5 == 0);
                                pixels[idx] = noisy ? highlightColor : (isBorder ? borderColor : baseColor);
                            }
                            else
                            {
                                pixels[idx] = Color.clear;
                            }
                            break;

                        case "door":
                            // Sturdy exit door with frame and bright green exit glow / knob
                            bool isDoorFrame = x < 4 || x >= width - 4 || y >= height - 4;
                            bool isKnob = (x >= width - 10 && x <= width - 6 && y >= height / 2 - 2 && y <= height / 2 + 2);
                            bool isExitSign = (x >= width / 4 && x <= width * 3 / 4 && y >= height - 16 && y <= height - 8);

                            if (isExitSign)
                            {
                                pixels[idx] = new Color(0.2f, 0.9f, 0.3f, 1f); // Bright green EXIT indicator
                            }
                            else if (isKnob)
                            {
                                pixels[idx] = new Color(1f, 0.85f, 0.2f, 1f); // Gold knob
                            }
                            else if (isDoorFrame)
                            {
                                pixels[idx] = borderColor;
                            }
                            else
                            {
                                pixels[idx] = baseColor;
                            }
                            break;

                        case "char_idle":
                        case "char_hiding":
                        case "char_run":
                        case "char_hurt":
                        case "char_cough":
                            // Pixel humanoid figure
                            int headBottom = height * 2 / 3;
                            int headTop = height - 2;
                            int torsoBottom = height / 3;
                            int torsoLeft = width / 4;
                            int torsoRight = width * 3 / 4;

                            bool inHead = y >= headBottom && y <= headTop && x >= torsoLeft && x <= torsoRight;
                            bool inTorso = y >= torsoBottom && y < headBottom && x >= torsoLeft && x <= torsoRight;
                            bool inLegs = y < torsoBottom && (x >= torsoLeft && x <= torsoLeft + 4 || x <= torsoRight && x >= torsoRight - 4);

                            if (type == "char_hiding")
                            {
                                // Crouched lower
                                bool inCrouch = y <= height / 2 && x >= 2 && x <= width - 2;
                                pixels[idx] = inCrouch ? (isBorder ? borderColor : baseColor) : Color.clear;
                            }
                            else if (type == "char_cough")
                            {
                                // Coughing: bent forward slightly with hand to face
                                bool inCoughHead = y >= headBottom - 4 && y <= headTop - 4 && x >= torsoLeft + 4 && x <= torsoRight + 4;
                                bool inCoughTorso = y >= torsoBottom && y < headBottom - 4 && x >= torsoLeft + 2 && x <= torsoRight + 2;
                                if (inCoughHead || inCoughTorso || inLegs)
                                {
                                    pixels[idx] = isBorder ? borderColor : baseColor;
                                }
                                else
                                {
                                    pixels[idx] = Color.clear;
                                }
                            }
                            else if (inHead || inTorso || inLegs)
                            {
                                if (inHead && y == headTop - 4 && (x == torsoLeft + 3 || x == torsoRight - 3))
                                {
                                    pixels[idx] = Color.white; // Eyes
                                }
                                else
                                {
                                    pixels[idx] = isBorder ? borderColor : baseColor;
                                }
                            }
                            else
                            {
                                pixels[idx] = Color.clear;
                            }
                            break;

                        case "char_crawl":
                            // Low crawl pose on hands and knees
                            bool inCrawlBody = y >= 2 && y <= height - 4 && x >= 4 && x <= width - 4;
                            if (inCrawlBody)
                            {
                                bool isCrawlHead = x >= width - 12 && y >= height / 2;
                                pixels[idx] = isCrawlHead ? Color.Lerp(baseColor, Color.white, 0.2f) : (isBorder ? borderColor : baseColor);
                            }
                            else
                            {
                                pixels[idx] = Color.clear;
                            }
                            break;

                        case "door_closed":
                            bool isClosedDoorFrame = x < 4 || x >= width - 4 || y >= height - 4;
                            bool isClosedKnob = (x >= width - 10 && x <= width - 6 && y >= height / 2 - 2 && y <= height / 2 + 2);
                            if (isClosedKnob)
                            {
                                pixels[idx] = new Color(1f, 0.85f, 0.2f, 1f);
                            }
                            else if (isClosedDoorFrame)
                            {
                                pixels[idx] = borderColor;
                            }
                            else
                            {
                                pixels[idx] = baseColor;
                            }
                            break;

                        case "door_open":
                            bool isOpenFrame = x < 4 || x >= width - 4 || y >= height - 4;
                            if (isOpenFrame)
                            {
                                pixels[idx] = borderColor;
                            }
                            else
                            {
                                // Open portal: dark smoky interior with warm glow
                                float warm = (float)y / height;
                                pixels[idx] = Color.Lerp(new Color(0.1f, 0.05f, 0.05f, 1f), new Color(0.4f, 0.15f, 0.05f, 1f), warm);
                            }
                            break;

                        case "flame_1":
                        case "flame_2":
                            // Teardrop / jagged flame shape
                            int flameCenter = width / 2;
                            int distFlameX = Mathf.Abs(x - flameCenter);
                            int maxFlameW = (type == "flame_1") ? (height - y) / 2 + 2 : (height - y) / 2 + 4;
                            if (distFlameX < maxFlameW && y < height - 3)
                            {
                                float coreDist = (float)distFlameX / Mathf.Max(1, maxFlameW);
                                if (coreDist < 0.35f && y < height * 0.7f)
                                {
                                    pixels[idx] = new Color(1f, 0.95f, 0.4f, 1f); // Hot yellow core
                                }
                                else if (coreDist < 0.75f)
                                {
                                    pixels[idx] = new Color(1f, 0.5f, 0.1f, 1f); // Orange mid-flame
                                }
                                else
                                {
                                    pixels[idx] = new Color(0.9f, 0.2f, 0.05f, 0.9f); // Dark red flame tips
                                }
                            }
                            else
                            {
                                pixels[idx] = Color.clear;
                            }
                            break;

                        case "smoke_overlay":
                            // Descending smoke gradient
                            float smokeRatio = (float)y / height; // 1 at top, 0 at bottom
                            float smokeA = Mathf.Clamp01(Mathf.Pow(smokeRatio, 0.6f) * baseColor.a);
                            bool smokeBillow = ((x * 11 + y * 17) % 7 == 0);
                            Color smCol = baseColor;
                            smCol.a = smokeBillow ? smokeA * 0.9f : smokeA;
                            pixels[idx] = smCol;
                            break;

                        case "exit_sign":
                            // Green glowing exit sign with border
                            bool isSignBorder = x < 3 || x >= width - 3 || y < 3 || y >= height - 3;
                            if (isSignBorder)
                            {
                                pixels[idx] = new Color(0.1f, 0.4f, 0.15f, 1f);
                            }
                            else
                            {
                                bool isTextPixels = (x >= width / 4 && x <= width * 3 / 4 && y >= height / 3 && y <= height * 2 / 3);
                                pixels[idx] = isTextPixels ? Color.white : new Color(0.15f, 0.85f, 0.35f, 1f);
                            }
                            break;

                        case "stairs":
                            // Stepped stair pattern
                            int stepIndex = (x * 5) / width;
                            int stepTop = ((stepIndex + 1) * height) / 5;
                            if (y <= stepTop)
                            {
                                bool isStepEdge = (y == stepTop || (x * 5) % width == 0);
                                pixels[idx] = isStepEdge ? highlightColor : (isBorder ? borderColor : baseColor);
                            }
                            else
                            {
                                pixels[idx] = Color.clear;
                            }
                            break;

                        case "elevator_door":
                            // Metallic doors with middle divider
                            bool isElevBorder = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
                            bool isMidSplit = (x >= width / 2 - 1 && x <= width / 2 + 1);
                            bool isCallPanel = (x >= width - 12 && x <= width - 8 && y >= height / 2 - 4 && y <= height / 2 + 8);
                            if (isElevBorder || isMidSplit)
                            {
                                pixels[idx] = borderColor;
                            }
                            else if (isCallPanel)
                            {
                                pixels[idx] = new Color(0.95f, 0.25f, 0.2f, 1f); // Warning / red prohibited indicator
                            }
                            else
                            {
                                pixels[idx] = baseColor;
                            }
                            break;

                        case "hand_icon":
                            // Hand silhouette
                            int handCenterX = width / 2;
                            int handCenterY = height / 2;
                            int dHand = Mathf.Abs(x - handCenterX) + Mathf.Abs(y - handCenterY);
                            if (dHand < width / 2)
                            {
                                pixels[idx] = isBorder ? borderColor : baseColor;
                            }
                            else
                            {
                                pixels[idx] = Color.clear;
                            }
                            break;

                        default:
                            pixels[idx] = isBorder ? borderColor : baseColor;
                            break;
                    }
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            return tex;
        }
    }
}

