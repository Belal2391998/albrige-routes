namespace AlbrigeTransport.Models;

public class Station
{
    public int Id { get; set; }

    public int TransportLineId { get; set; }

    public TransportLine Line { get; set; } = null!;

    public int StationNumber { get; set; }

    public string StationName { get; set; } = string.Empty;

    public string StationNameEn { get; set; } = string.Empty;

    public string? StationNameDe { get; set; }

    public string DescriptionOrLandmark { get; set; } = string.Empty;

    public string DescriptionOrLandmarkEn { get; set; } = string.Empty;

    public string? DescriptionOrLandmarkDe { get; set; }

    public string DistanceText { get; set; } = string.Empty;

    public string ImagePath { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string GoogleMapsUrl { get; set; } = string.Empty;

    /// <summary>Traffic status: سالك | بطيء | مزدحم</summary>
    public string TrafficStatus { get; set; } = "سالك";

    /// <summary>Primary display departure / first gathering time, e.g. "07:00 AM".</summary>
    public string DefaultGatheringTime { get; set; } = string.Empty;

    public string AdminNotes { get; set; } = string.Empty;

    public ICollection<LectureSchedule> LectureSchedules { get; set; } = new List<LectureSchedule>();
}
