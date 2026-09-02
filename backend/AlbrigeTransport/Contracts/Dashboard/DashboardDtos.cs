namespace AlbrigeTransport.Contracts.Dashboard;

public sealed class DashboardOverviewDto
{
    public int TotalLines { get; set; }
    public int ActiveLines { get; set; }
    public int TotalGatheringPoints { get; set; }
    public int ActiveGatheringPoints { get; set; }
    public bool IsSyncedWithLiveServers { get; set; }
    public string SyncStatusLabel { get; set; } = string.Empty;
    public DateTime LastUpdatedUtc { get; set; }
    public string DatabaseProvider { get; set; } = "SQLite";
}
