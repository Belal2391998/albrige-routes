namespace AlbrigeTransport.Contracts.Settings;

public sealed class SiteSettingsDto
{
    public bool ShowScheduleTimes { get; set; }
    public string StatusBadgeText { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public sealed class UpdateSiteSettingsRequest
{
    public bool ShowScheduleTimes { get; set; }
    public string? StatusBadgeText { get; set; }
}

public sealed class LocalizationInfoDto
{
    public string RequestedCulture { get; set; } = "ar";
    public IReadOnlyList<string> SupportedCultures { get; set; } = ["ar", "en", "de"];
    public IReadOnlyDictionary<string, string> Labels { get; set; } =
        new Dictionary<string, string>();
}
