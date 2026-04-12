using System;
using POIApp.Services;

namespace POIApp.Services;

/// <summary>
/// Helper class for audio path resolution.
/// Centralizes audio file path logic to avoid duplicate code.
/// </summary>
public static class AudioPathHelper
{
    /// <summary>
    /// Get audio bundle path for given language and POI ID.
    /// Pattern: audio/{lang}/poi{id}-{lang}.mp3
    /// </summary>
    /// <param name="language">Language code: vi, en, zh, kr, jp</param>
    /// <param name="poiId">POI ID number</param>
    /// <returns>Bundle path: audio/vi/poi1-vi.mp3</returns>
    public static string GetAudioPath(string language, int poiId)
    {
        var suffix = GetAudioSuffix(language);
        return $"audio/{language}/poi{poiId}-{suffix}.mp3";
    }

    /// <summary>
    /// Get audio suffix based on language code.
    /// All languages use the same suffix as their code.
    /// </summary>
    private static string GetAudioSuffix(string language)
    {
        return language.ToLowerInvariant() switch
        {
            LanguageService.LangVi => LanguageService.LangVi,
            LanguageService.LangEn => LanguageService.LangEn,
            LanguageService.LangZh => LanguageService.LangZh,
            LanguageService.LangKr => LanguageService.LangKr,
            LanguageService.LangJp => LanguageService.LangJp,
            _ => language.ToLowerInvariant()
        };
    }

    /// <summary>
    /// Validate if language code is supported.
    /// </summary>
    /// <param name="language">Language code to validate</param>
    /// <returns>True if supported</returns>
    public static bool IsSupportedLanguage(string language)
    {
        if (string.IsNullOrWhiteSpace(language))
            return false;

        return Array.Exists(
            LanguageService.SupportedAudioLanguages,
            lang => lang.Equals(language, StringComparison.OrdinalIgnoreCase)
        );
    }

    /// <summary>
    /// Get display name for language code.
    /// </summary>
    public static string GetDisplayName(string language)
    {
        return language.ToLowerInvariant() switch
        {
            LanguageService.LangVi => "Tiếng Việt",
            LanguageService.LangEn => "English",
            LanguageService.LangZh => "中文",
            LanguageService.LangKr => "한국어",
            LanguageService.LangJp => "日本語",
            _ => language
        };
    }
}
