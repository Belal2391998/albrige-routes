namespace AlbrigeTransport.Contracts.Transport;

using AlbrigeTransport.Contracts;

public sealed class TransportLineDto
{
    public int Id { get; set; }
    public int LineNumber { get; set; }
    public LocalizedTextDto Name { get; set; } = new();
    public string Slug { get; set; } = string.Empty;
    public LocalizedTextDto DescriptionOrRouteRange { get; set; } = new();
    public LocalizedTextDto Badge { get; set; } = new();
    public bool IsVisibleInPublicMenu { get; set; }
    public int GatheringPointsCount { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public DateTime UpdatedAt { get; set; }
    public IReadOnlyList<string> ReturnDepartureTimes { get; set; } = Array.Empty<string>();
    public int StationCount { get; set; }
}

public sealed class CreateTransportLineRequest
{
    public int LineNumber { get; set; }
    public string LineName { get; set; } = string.Empty;
    public string? LineNameEn { get; set; }
    public string? LineNameDe { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string DescriptionOrRouteRange { get; set; } = string.Empty;
    public string? DescriptionOrRouteRangeEn { get; set; }
    public string? DescriptionOrRouteRangeDe { get; set; }
    public bool IsVisibleInPublicMenu { get; set; } = true;
    public int EstimatedDurationMinutes { get; set; } = 60;
}

public sealed class UpdateTransportLineRequest
{
    public string LineName { get; set; } = string.Empty;
    public string? LineNameEn { get; set; }
    public string? LineNameDe { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string DescriptionOrRouteRange { get; set; } = string.Empty;
    public string? DescriptionOrRouteRangeEn { get; set; }
    public string? DescriptionOrRouteRangeDe { get; set; }
    public bool IsVisibleInPublicMenu { get; set; }
    public int EstimatedDurationMinutes { get; set; }
}

public sealed class ToggleLineVisibilityRequest
{
    public bool IsVisibleInPublicMenu { get; set; }
}

public sealed class BatchSaveLinesRequest
{
    public IReadOnlyList<BatchLineItem> Lines { get; set; } = Array.Empty<BatchLineItem>();
}

public sealed class BatchLineItem
{
    public int Id { get; set; }
    public string LineName { get; set; } = string.Empty;
    public string? LineNameEn { get; set; }
    public string? LineNameDe { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string DescriptionOrRouteRange { get; set; } = string.Empty;
    public string? DescriptionOrRouteRangeEn { get; set; }
    public string? DescriptionOrRouteRangeDe { get; set; }
    public bool IsVisibleInPublicMenu { get; set; }
    public int EstimatedDurationMinutes { get; set; }
}
