using AlbrigeTransport.Contracts.Dashboard;
using AlbrigeTransport.Data;
using Microsoft.EntityFrameworkCore;

namespace AlbrigeTransport.Services;

public interface IDashboardService
{
    Task<DashboardOverviewDto> GetOverviewAsync(string culture, CancellationToken ct = default);
}

public sealed class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    private readonly ILocaleService _locale;

    public DashboardService(AppDbContext db, ILocaleService locale)
    {
        _db = db;
        _locale = locale;
    }

    public async Task<DashboardOverviewDto> GetOverviewAsync(string culture, CancellationToken ct = default)
    {
        var lines = await _db.TransportLines
            .AsNoTracking()
            .Include(l => l.Stations)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        var activeLines = lines.Count(l => l.IsVisibleInPublicMenu);
        var totalStations = lines.Sum(l => l.Stations.Count);
        var activeStations = lines.Where(l => l.IsVisibleInPublicMenu).Sum(l => l.Stations.Count);
        var lastUpdated = lines.Count > 0 ? lines.Max(l => l.UpdatedAt) : DateTime.UtcNow;

        var canConnect = await _db.Database.CanConnectAsync(ct).ConfigureAwait(false);

        return new DashboardOverviewDto
        {
            TotalLines = lines.Count,
            ActiveLines = activeLines,
            TotalGatheringPoints = totalStations,
            ActiveGatheringPoints = activeStations,
            IsSyncedWithLiveServers = canConnect,
            SyncStatusLabel = canConnect
                ? _locale.T("sync_live", culture)
                : _locale.T("sync_local", culture),
            LastUpdatedUtc = lastUpdated,
            DatabaseProvider = _db.Database.ProviderName?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) == true
                ? "SQLite"
                : _db.Database.ProviderName ?? "SQLite",
        };
    }
}
