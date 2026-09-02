using System.Text.Json;
using System.Text.Json.Serialization;

namespace AlbrigeTransport.Data;

/// <summary>
/// English seed translations extracted from src/data/transportData.ts
/// (scripts/extract-localizations.mjs). German is edited in the admin UI.
/// </summary>
internal static class LocalizationSeedData
{
    private sealed class Root
    {
        [JsonPropertyName("lines")]
        public List<LineEntry> Lines { get; set; } = [];

        [JsonPropertyName("stops")]
        public List<StopEntry> Stops { get; set; } = [];
    }

    private sealed class LineEntry
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("nameEn")]
        public string NameEn { get; set; } = string.Empty;

        [JsonPropertyName("descEn")]
        public string DescEn { get; set; } = string.Empty;
    }

    private sealed class StopEntry
    {
        [JsonPropertyName("lineId")]
        public int LineId { get; set; }

        [JsonPropertyName("order")]
        public int Order { get; set; }

        [JsonPropertyName("nameEn")]
        public string NameEn { get; set; } = string.Empty;

        [JsonPropertyName("descEn")]
        public string DescEn { get; set; } = string.Empty;
    }

    private static readonly Lazy<Root> Cache = new(Load);

    internal static string? LineNameEn(int lineId) =>
        Cache.Value.Lines.FirstOrDefault(l => l.Id == lineId)?.NameEn
        ?? DefaultLines.FirstOrDefault(l => l.Id == lineId).NameEn;

    internal static string? LineDescriptionEn(int lineId) =>
        Cache.Value.Lines.FirstOrDefault(l => l.Id == lineId)?.DescEn
        ?? DefaultLines.FirstOrDefault(l => l.Id == lineId).DescEn;

    internal static (string NameEn, string DescEn)? StopEn(int lineId, int stationNumber)
    {
        var hit = Cache.Value.Stops.FirstOrDefault(s => s.LineId == lineId && s.Order == stationNumber);
        return hit is null ? null : (hit.NameEn, hit.DescEn);
    }

    private static readonly (int Id, string NameEn, string DescEn)[] DefaultLines =
    [
        (1, "Abu Nseir Line", "From Abu Nseir Grand Mosque to Manaseer Station"),
        (2, "Consultations Line", "From Consultations building to Manaseer Station"),
        (3, "Areefa Mall Line", "From Areefa Mall to Al-Shaab Nuts Shop on Al-Salam Road"),
        (4, "Salt Line", "From Al-Balqa University triangle to Al-Kamaliya Roundabout"),
        (5, "Sahab Line", "South Amman line — from Sahab entrance to Al-Yasmeen Roundabout"),
    ];

    private static Root Load()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "localization-seed.json");
        if (!File.Exists(path))
        {
            path = Path.Combine(Directory.GetCurrentDirectory(), "Data", "localization-seed.json");
        }

        if (!File.Exists(path))
        {
            return new Root();
        }

        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<Root>(json) ?? new Root();
    }
}
