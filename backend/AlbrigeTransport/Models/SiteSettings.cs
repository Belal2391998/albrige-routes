namespace AlbrigeTransport.Models;

public class SiteSettings
{
    public int Id { get; set; }

    public bool ShowScheduleTimes { get; set; } = true;

    public string StatusBadgeText { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; }
}
