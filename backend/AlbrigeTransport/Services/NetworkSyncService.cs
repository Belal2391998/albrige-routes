using AlbrigeTransport.Contracts.Network;
using AlbrigeTransport.Contracts.Settings;
using AlbrigeTransport.Contracts.Stations;
using AlbrigeTransport.Contracts.Transport;
using AlbrigeTransport.Data;
using Microsoft.EntityFrameworkCore;

namespace AlbrigeTransport.Services;

public interface INetworkSyncService
{
    Task<NetworkSnapshotDto> GetSnapshotAsync(bool publicOnly = false, CancellationToken ct = default);
    Task<NetworkSyncResponse> SyncAsync(NetworkSyncRequest request, CancellationToken ct = default);
}

public sealed class NetworkSyncService : INetworkSyncService
{
    private readonly AppDbContext _db;
    private readonly ISettingsService _settings;

    public NetworkSyncService(AppDbContext db, ISettingsService settings)
    {
        _db = db;
        _settings = settings;
    }

    public async Task<NetworkSnapshotDto> GetSnapshotAsync(bool publicOnly = false, CancellationToken ct = default)
    {
        var linesQuery = _db.TransportLines
            .AsNoTracking()
            .Include(l => l.UniversityDepartureTimes)
            .Include(l => l.Stations)
            .ThenInclude(s => s.LectureSchedules)
            .AsQueryable();

        if (publicOnly)
        {
            linesQuery = linesQuery.Where(l => l.IsVisibleInPublicMenu);
        }

        var lines = await linesQuery.OrderBy(l => l.LineNumber).ToListAsync(ct).ConfigureAwait(false);
        var settings = await _settings.GetAsync(ct).ConfigureAwait(false);

        var lineDtos = lines.Select(l => EntityMapper.ToLineDto(l)).ToArray();
        var stationDtos = lines
            .SelectMany(l => l.Stations.OrderBy(s => s.StationNumber))
            .Select(s => EntityMapper.ToStationDto(s))
            .ToArray();

        var updatedAt = lines.Count > 0
            ? lines.Max(l => l.UpdatedAt)
            : settings.UpdatedAt;

        return new NetworkSnapshotDto
        {
            Version = 1,
            UpdatedAt = updatedAt,
            Settings = settings,
            Lines = lineDtos,
            Stations = stationDtos,
        };
    }

    public async Task<NetworkSyncResponse> SyncAsync(NetworkSyncRequest request, CancellationToken ct = default)
    {
        if (request.Settings is not null)
        {
            await _settings.UpdateAsync(new UpdateSiteSettingsRequest
            {
                ShowScheduleTimes = request.Settings.ShowScheduleTimes,
                StatusBadgeText = request.Settings.StatusBadgeText,
            }, ct).ConfigureAwait(false);
        }

        if (request.Lines is not null)
        {
            foreach (var lineDto in request.Lines)
            {
                var line = await _db.TransportLines.FirstOrDefaultAsync(l => l.Id == lineDto.Id, ct)
                    .ConfigureAwait(false);
                if (line is null)
                {
                    continue;
                }

                line.LineName = lineDto.Name.Ar;
                line.LineNameEn = string.IsNullOrWhiteSpace(lineDto.Name.En) ? lineDto.Name.Ar : lineDto.Name.En;
                line.LineNameDe = lineDto.Name.De;
                line.Slug = lineDto.Slug;
                line.DescriptionOrRouteRange = lineDto.DescriptionOrRouteRange.Ar;
                line.DescriptionOrRouteRangeEn = string.IsNullOrWhiteSpace(lineDto.DescriptionOrRouteRange.En)
                    ? lineDto.DescriptionOrRouteRange.Ar
                    : lineDto.DescriptionOrRouteRange.En;
                line.DescriptionOrRouteRangeDe = lineDto.DescriptionOrRouteRange.De;
                line.IsVisibleInPublicMenu = lineDto.IsVisibleInPublicMenu;
                line.EstimatedDurationMinutes = lineDto.EstimatedDurationMinutes;
                line.GatheringPointsCount = lineDto.GatheringPointsCount;
                line.UpdatedAt = DateTime.UtcNow;
            }
        }

        if (request.Stations is not null)
        {
            foreach (var stationDto in request.Stations)
            {
                var station = await _db.Stations
                    .Include(s => s.LectureSchedules)
                    .FirstOrDefaultAsync(s => s.Id == stationDto.Id, ct)
                    .ConfigureAwait(false);

                if (station is null)
                {
                    continue;
                }

                station.StationName = stationDto.Name.Ar;
                station.StationNameEn = string.IsNullOrWhiteSpace(stationDto.Name.En)
                    ? stationDto.Name.Ar
                    : stationDto.Name.En;
                station.StationNameDe = stationDto.Name.De;
                station.DescriptionOrLandmark = stationDto.DescriptionOrLandmark.Ar;
                station.DescriptionOrLandmarkEn = string.IsNullOrWhiteSpace(stationDto.DescriptionOrLandmark.En)
                    ? stationDto.DescriptionOrLandmark.Ar
                    : stationDto.DescriptionOrLandmark.En;
                station.DescriptionOrLandmarkDe = stationDto.DescriptionOrLandmark.De;
                station.DistanceText = stationDto.DistanceText;
                station.ImagePath = stationDto.ImagePath;
                station.Latitude = stationDto.Latitude;
                station.Longitude = stationDto.Longitude;
                station.GoogleMapsUrl = stationDto.GoogleMapsUrl;
                station.TrafficStatus = TrafficStatusMapper.ToArabic(stationDto.TrafficStatusCode);
                station.DefaultGatheringTime = stationDto.DefaultGatheringTime;
                station.AdminNotes = stationDto.AdminNotes;

                if (stationDto.LectureSchedules is { Count: > 0 })
                {
                    foreach (var schedDto in stationDto.LectureSchedules)
                    {
                        var existing = station.LectureSchedules.FirstOrDefault(l => l.Id == schedDto.Id);
                        if (existing is not null)
                        {
                            existing.LectureTime = schedDto.LectureTime;
                            existing.GatheringTime = schedDto.GatheringTime;
                        }
                    }

                    var first = station.LectureSchedules.OrderBy(l => l.LectureTime).FirstOrDefault();
                    if (first is not null && !string.IsNullOrWhiteSpace(station.DefaultGatheringTime))
                    {
                        first.GatheringTime = station.DefaultGatheringTime;
                    }
                }
            }
        }

        await _db.SaveChangesAsync(ct).ConfigureAwait(false);

        return new NetworkSyncResponse
        {
            Synced = true,
            Snapshot = await GetSnapshotAsync(false, ct).ConfigureAwait(false),
        };
    }
}
