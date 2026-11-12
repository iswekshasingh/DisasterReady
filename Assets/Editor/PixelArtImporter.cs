using UnityEditor;
using UnityEngine;
using DisasterSurvival.Core;

namespace DisasterSurvival.Editor
{
    /// <summary>
    /// AssetPostprocessor that automatically configures pixel-art textures added to Assets/Resources/Sprites/
    /// Sets Sprite (2D and UI), Filter Mode Point, Compression None, PPU = GameLayoutManager.PixelsPerUnit, Mipmaps Off.
    /// </summary>
    public class PixelArtImporter : AssetPostprocessor
    {
        private void OnPreprocessTexture()
        {
            if (assetPath.Contains("Assets/Resources/Sprites/"))
            {
                TextureImporter importer = (TextureImporter)assetImporter;
                if (importer != null)
                {
                    importer.textureType = TextureImporterType.Sprite;
                    // Runtime character poses need the complete image; alpha auto-slicing can
                    // split a person and their speech bubble into separate sub-sprites.
                    importer.spriteImportMode = SpriteImportMode.Single;
                    importer.spritePixelsPerUnit = GameLayoutManager.PixelsPerUnit;
                    importer.filterMode = FilterMode.Point;
                    importer.textureCompression = TextureImporterCompression.Uncompressed;
                    importer.mipmapEnabled = false;
                }
            }
        }
    }
}

