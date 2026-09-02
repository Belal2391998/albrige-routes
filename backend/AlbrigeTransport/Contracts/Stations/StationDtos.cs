namespace AlbrigeTransport.Contracts.Stations;

using System.ComponentModel.DataAnnotations;
using AlbrigeTransport.Contracts;

public sealed class LectureScheduleDto
{
    public int Id { get; set; }
    public string LectureTime { get; set; } = string.Empty;
    public string GatheringTime { get; set; } = string.Empty;
}

public sealed class StationDto
{
    public int Id { get; set; }
    public int TransportLineId { get; set; }
    public int StationNumber { get; set; }
    public LocalizedTextDto Name { get; set; } = new();
    public LocalizedTextDto DescriptionOrLandmark { get; set; } = new();
    public string DistanceText { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string GoogleMapsUrl { get; set; } = string.Empty;
    public string TrafficStatus { get; set; } = "سالك";
    public string TrafficStatusCode { get; set; } = "clear";
    public string DefaultGatheringTime { get; set; } = string.Empty;
    public string AdminNotes { get; set; } = string.Empty;
    public IReadOnlyList<LectureScheduleDto> LectureSchedules { get; set; } = Array.Empty<LectureScheduleDto>();
}

public sealed class CreateStationRequest
{
    public int TransportLineId { get; set; }
    public string StationName { get; set; } = "محطة جديدة";
    public string? StationNameEn { get; set; }
    public string? StationNameDe { get; set; }
    public string DescriptionOrLandmark { get; set; } = string.Empty;
    public string? DescriptionOrLandmarkEn { get; set; }
    public string? DescriptionOrLandmarkDe { get; set; }
    public string DistanceText { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public double Latitude { get; set; } = 31.95;
    public double Longitude { get; set; } = 35.91;
    public string GoogleMapsUrl { get; set; } = string.Empty;

    [TrafficStatusCode]
    public string TrafficStatusCode { get; set; } = "clear";

    public string DefaultGatheringTime { get; set; } = "07:00 AM";
    public string AdminNotes { get; set; } = string.Empty;
}

public sealed class UpdateStationRequest
{
    public string StationName { get; set; } = string.Empty;
    public string? StationNameEn { get; set; }
    public string? StationNameDe { get; set; }
    public string DescriptionOrLandmark { get; set; } = string.Empty;
    public string? DescriptionOrLandmarkEn { get; set; }
    public string? DescriptionOrLandmarkDe { get; set; }
    public string DistanceText { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string GoogleMapsUrl { get; set; } = string.Empty;

    [TrafficStatusCode]
    public string TrafficStatusCode { get; set; } = "clear";

    public string DefaultGatheringTime { get; set; } = string.Empty;
    public string AdminNotes { get; set; } = string.Empty;
    public IReadOnlyList<LectureScheduleDto>? LectureSchedules { get; set; }
}

public sealed class BatchSaveStationsRequest
{
    public IReadOnlyList<BatchStationItem> Stations { get; set; } = Array.Empty<BatchStationItem>();
}

public sealed class BatchStationItem
{
    public int Id { get; set; }
    public string? DefaultGatheringTime { get; set; }

    [TrafficStatusCode]
    public string TrafficStatusCode { get; set; } = "clear";

    public string? AdminNotes { get; set; }
    public string? StationName { get; set; }
    public string? StationNameEn { get; set; }
    public string? StationNameDe { get; set; }
    public string? DescriptionOrLandmark { get; set; }
    public string? DescriptionOrLandmarkEn { get; set; }
    public string? DescriptionOrLandmarkDe { get; set; }
    public string? ImagePath { get; set; }
    public string? GoogleMapsUrl { get; set; }
}

public sealed class StationImageUploadResponse
{
    public string ImagePath { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
}

public sealed class RestoreDefaultsResponse
{
    public int LinesRestored { get; set; }
    public int StationsRestored { get; set; }
    public int LectureSchedulesRestored { get; set; }
}
