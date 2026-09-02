namespace AlbrigeTransport.Services;

public static class TrafficStatusMapper
{
    private static readonly Dictionary<string, string> CodeToArabic = new(StringComparer.OrdinalIgnoreCase)
    {
        ["clear"] = "سالك",
        ["moderate"] = "بطيء",
        ["congested"] = "مزدحم",
    };

    private static readonly Dictionary<string, string> ArabicToCode =
        CodeToArabic.ToDictionary(kvp => kvp.Value, kvp => kvp.Key, StringComparer.Ordinal);

    /// <summary>
    /// Accepted values are the codes (clear/moderate/congested), their Arabic
    /// equivalents, or blank (which defaults to "clear"). Anything else is rejected
    /// so a typo cannot silently downgrade a station to "سالك".
    /// </summary>
    public static bool IsAccepted(string? codeOrArabic)
    {
        if (string.IsNullOrWhiteSpace(codeOrArabic))
        {
            return true;
        }

        var trimmed = codeOrArabic.Trim();
        return CodeToArabic.ContainsKey(trimmed) || ArabicToCode.ContainsKey(trimmed);
    }

    public static IReadOnlyCollection<string> AcceptedCodes => CodeToArabic.Keys;

    public static string ToArabic(string codeOrArabic)
    {
        if (string.IsNullOrWhiteSpace(codeOrArabic))
        {
            return "سالك";
        }

        if (CodeToArabic.TryGetValue(codeOrArabic.Trim(), out var arabic))
        {
            return arabic;
        }

        return ArabicToCode.ContainsKey(codeOrArabic.Trim()) ? codeOrArabic.Trim() : "سالك";
    }

    public static string ToCode(string codeOrArabic)
    {
        if (string.IsNullOrWhiteSpace(codeOrArabic))
        {
            return "clear";
        }

        var trimmed = codeOrArabic.Trim();
        if (CodeToArabic.ContainsKey(trimmed))
        {
            return trimmed.ToLowerInvariant();
        }

        return ArabicToCode.TryGetValue(trimmed, out var code) ? code : "clear";
    }
}
