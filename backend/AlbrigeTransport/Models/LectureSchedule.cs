namespace AlbrigeTransport.Models;

public class LectureSchedule
{
    public int Id { get; set; }

    public int StationId { get; set; }

    public Station Station { get; set; } = null!;

    /// <summary>Lecture slot label, e.g. "8:30", "10:00", "11:30".</summary>
    public string LectureTime { get; set; } = string.Empty;

    /// <summary>Pickup/gathering time for that lecture, e.g. "06:50 AM".</summary>
    public string GatheringTime { get; set; } = string.Empty;
}
