namespace AlbrigeTransport.Models;

public class TransportLine
{
    public int Id { get; set; }

    public int LineNumber { get; set; }

    public string LineName { get; set; } = string.Empty;

    public string LineNameEn { get; set; } = string.Empty;

    public string? LineNameDe { get; set; }

    public string Slug { get; set; } = string.Empty;

    public string DescriptionOrRouteRange { get; set; } = string.Empty;

    public string DescriptionOrRouteRangeEn { get; set; } = string.Empty;

    public string? DescriptionOrRouteRangeDe { get; set; }

    public bool IsVisibleInPublicMenu { get; set; } = true;

    public int GatheringPointsCount { get; set; }

    public int EstimatedDurationMinutes { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<Station> Stations { get; set; } = new List<Station>();

    public ICollection<UniversityDepartureTime> UniversityDepartureTimes { get; set; } =
        new List<UniversityDepartureTime>();
}
