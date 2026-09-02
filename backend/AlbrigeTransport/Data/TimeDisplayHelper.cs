namespace AlbrigeTransport.Data;

internal static class TimeDisplayHelper
{
    public static string ToDisplayTime(string time24)
    {
        var parts = time24.Trim().Split(':');
        if (parts.Length != 2 || !int.TryParse(parts[0], out var hours) || !int.TryParse(parts[1], out var minutes))
        {
            return time24;
        }

        var ampm = hours >= 12 ? "PM" : "AM";
        var h12 = hours switch
        {
            0 => 12,
            > 12 => hours - 12,
            _ => hours,
        };

        return $"{h12:D2}:{minutes:D2} {ampm}";
    }
}
