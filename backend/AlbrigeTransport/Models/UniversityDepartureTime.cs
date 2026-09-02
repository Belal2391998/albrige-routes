namespace AlbrigeTransport.Models;

public class UniversityDepartureTime
{
    public int Id { get; set; }

    public int TransportLineId { get; set; }

    public TransportLine Line { get; set; } = null!;

    /// <summary>Display-ready time, e.g. "11:40 AM".</summary>
    public string TimeString { get; set; } = string.Empty;
}
