using AlbrigeTransport.Contracts.Stations;
using AlbrigeTransport.Data;
using AlbrigeTransport.Models;
using Microsoft.EntityFrameworkCore;

namespace AlbrigeTransport.Services;

public interface IStationService
{
    Task<IReadOnlyList<StationDto>> GetByLineAsync(int lineId, CancellationToken ct = default);
    Task<StationDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<StationDto> CreateAsync(CreateStationRequest request, CancellationToken ct = default);
    Task<StationDto?> UpdateAsync(int id, UpdateStationRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<StationDto>> BatchSaveByLineAsync(int lineId, BatchSaveStationsRequest request, CancellationToken ct = default);
    Task<StationImageUploadResponse?> UploadImageAsync(int id, IFormFile file, CancellationToken ct = default);
    Task<RestoreDefaultsResponse> RestoreDefaultsAsync(CancellationToken ct = default);
}

public sealed class StationService : IStationService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public StationService(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async Task<IReadOnlyList<StationDto>> GetByLineAsync(int lineId, CancellationToken ct = default)
    {
        var stations = await QueryDetailed()
            .Where(s => s.TransportLineId == lineId)
            .OrderBy(s => s.StationNumber)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return stations.Select(EntityMapper.ToStationDto).ToArray();
    }

    public async Task<StationDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var station = await QueryDetailed().FirstOrDefaultAsync(s => s.Id == id, ct).ConfigureAwait(false);
        return station is null ? null : EntityMapper.ToStationDto(station);
    }

    public async Task<StationDto> CreateAsync(CreateStationRequest request, CancellationToken ct = default)
    {
        var lineExists = await _db.TransportLines
            .AnyAsync(l => l.Id == request.TransportLineId, ct)
            .ConfigureAwait(false);

        if (!lineExists)
        {
            throw new InvalidOperationException($"Transport line {request.TransportLineId} was not found.");
        }

        var nextNumber = await _db.Stations
            .Where(s => s.TransportLineId == request.TransportLineId)
            .Select(s => (int?)s.StationNumber)
            .MaxAsync(ct)
            .ConfigureAwait(false) ?? 0;

        var station = new Station
        {
            TransportLineId = request.TransportLineId,
            StationNumber = nextNumber + 1,
            StationName = request.StationName.Trim(),
            StationNameEn = string.IsNullOrWhiteSpace(request.StationNameEn)
                ? request.StationName.Trim()
                : request.StationNameEn.Trim(),
            StationNameDe = string.IsNullOrWhiteSpace(request.StationNameDe)
                ? null
                : request.StationNameDe.Trim(),
            DescriptionOrLandmark = request.DescriptionOrLandmark.Trim(),
            DescriptionOrLandmarkEn = string.IsNullOrWhiteSpace(request.DescriptionOrLandmarkEn)
                ? request.DescriptionOrLandmark.Trim()
                : request.DescriptionOrLandmarkEn.Trim(),
            DescriptionOrLandmarkDe = string.IsNullOrWhiteSpace(request.DescriptionOrLandmarkDe)
                ? null
                : request.DescriptionOrLandmarkDe.Trim(),
            DistanceText = request.DistanceText,
            ImagePath = request.ImagePath ?? string.Empty,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            GoogleMapsUrl = string.IsNullOrWhiteSpace(request.GoogleMapsUrl)
                ? $"https://www.google.com/maps?q={request.Latitude},{request.Longitude}"
                : request.GoogleMapsUrl.Trim(),
            TrafficStatus = TrafficStatusMapper.ToArabic(request.TrafficStatusCode),
            DefaultGatheringTime = request.DefaultGatheringTime,
            AdminNotes = request.AdminNotes,
        };

        _db.Stations.Add(station);
        await TouchLineAsync(request.TransportLineId, ct).ConfigureAwait(false);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);

        return EntityMapper.ToStationDto(
            await QueryDetailed().FirstAsync(s => s.Id == station.Id, ct).ConfigureAwait(false));
    }

    public async Task<StationDto?> UpdateAsync(int id, UpdateStationRequest request, CancellationToken ct = default)
    {
        var station = await _db.Stations
            .Include(s => s.LectureSchedules)
            .FirstOrDefaultAsync(s => s.Id == id, ct)
            .ConfigureAwait(false);

        if (station is null)
        {
            return null;
        }

        ApplyUpdate(station, request);
        await TouchLineAsync(station.TransportLineId, ct).ConfigureAwait(false);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);

        return EntityMapper.ToStationDto(await QueryDetailed().FirstAsync(s => s.Id == id, ct).ConfigureAwait(false));
    }

    public async Task<IReadOnlyList<StationDto>> BatchSaveByLineAsync(
        int lineId,
        BatchSaveStationsRequest request,
        CancellationToken ct = default)
    {
        var ids = request.Stations.Select(s => s.Id).ToArray();
        var stations = await _db.Stations
            .Include(s => s.LectureSchedules)
            .Where(s => s.TransportLineId == lineId && ids.Contains(s.Id))
            .ToListAsync(ct)
            .ConfigureAwait(false);

        foreach (var item in request.Stations)
        {
            var station = stations.FirstOrDefault(s => s.Id == item.Id);
            if (station is null)
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(item.StationName))
            {
                station.StationName = item.StationName.Trim();
            }

            if (!string.IsNullOrWhiteSpace(item.StationNameEn))
            {
                station.StationNameEn = item.StationNameEn.Trim();
            }

            if (item.StationNameDe is not null)
            {
                station.StationNameDe = string.IsNullOrWhiteSpace(item.StationNameDe)
                    ? null
                    : item.StationNameDe.Trim();
            }

            if (!string.IsNullOrWhiteSpace(item.DescriptionOrLandmark))
            {
                station.DescriptionOrLandmark = item.DescriptionOrLandmark.Trim();
            }

            if (!string.IsNullOrWhiteSpace(item.DescriptionOrLandmarkEn))
            {
                station.DescriptionOrLandmarkEn = item.DescriptionOrLandmarkEn.Trim();
            }

            if (item.DescriptionOrLandmarkDe is not null)
            {
                station.DescriptionOrLandmarkDe = string.IsNullOrWhiteSpace(item.DescriptionOrLandmarkDe)
                    ? null
                    : item.DescriptionOrLandmarkDe.Trim();
            }

            if (!string.IsNullOrWhiteSpace(item.DefaultGatheringTime))
            {
                station.DefaultGatheringTime = item.DefaultGatheringTime.Trim();
                var first = station.LectureSchedules.OrderBy(l => l.LectureTime).FirstOrDefault();
                if (first is not null)
                {
                    first.GatheringTime = station.DefaultGatheringTime;
                }
            }

            if (item.AdminNotes is not null)
            {
                station.AdminNotes = item.AdminNotes;
            }

            if (!string.IsNullOrWhiteSpace(item.ImagePath))
            {
                station.ImagePath = item.ImagePath;
            }

            if (!string.IsNullOrWhiteSpace(item.GoogleMapsUrl))
            {
                station.GoogleMapsUrl = item.GoogleMapsUrl.Trim();
            }

            station.TrafficStatus = TrafficStatusMapper.ToArabic(item.TrafficStatusCode);
        }

        await TouchLineAsync(lineId, ct).ConfigureAwait(false);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return await GetByLineAsync(lineId, ct).ConfigureAwait(false);
    }

    public async Task<StationImageUploadResponse?> UploadImageAsync(
        int id,
        IFormFile file,
        CancellationToken ct = default)
    {
        var station = await _db.Stations.FirstOrDefaultAsync(s => s.Id == id, ct).ConfigureAwait(false);
        if (station is null || file.Length == 0)
        {
            return null;
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp"))
        {
            ext = ".jpg";
        }

        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "stations");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"station-{id}{ext}";
        var physicalPath = Path.Combine(uploadsDir, fileName);

        await using (var stream = File.Create(physicalPath))
        {
            await file.CopyToAsync(stream, ct).ConfigureAwait(false);
        }

        var relativePath = $"/uploads/stations/{fileName}";
        station.ImagePath = relativePath;
        await TouchLineAsync(station.TransportLineId, ct).ConfigureAwait(false);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);

        return new StationImageUploadResponse
        {
            // Stored relative so the value stays valid across environments; the
            // controller turns it into an absolute URL for the response.
            ImagePath = relativePath,
            PublicUrl = relativePath,
        };
    }

    public async Task<RestoreDefaultsResponse> RestoreDefaultsAsync(CancellationToken ct = default)
    {
        var updatedAt = TransportNetworkSeedData.UpdatedAt;
        var linesRestored = 0;
        var stationsRestored = 0;
        var lecturesRestored = 0;

        foreach (var lineSeed in TransportNetworkSeedData.Lines)
        {
            var line = await _db.TransportLines
                .Include(l => l.UniversityDepartureTimes)
                .Include(l => l.Stations)
                .ThenInclude(s => s.LectureSchedules)
                .FirstOrDefaultAsync(l => l.Id == lineSeed.Id, ct)
                .ConfigureAwait(false);

            if (line is null)
            {
                continue;
            }

            line.LineName = lineSeed.LineName;
            line.LineNameEn = LocalizationSeedData.LineNameEn(lineSeed.Id) ?? lineSeed.LineName;
            line.LineNameDe = null;
            line.Slug = lineSeed.Slug;
            line.DescriptionOrRouteRange = lineSeed.DescriptionOrRouteRange;
            line.DescriptionOrRouteRangeEn =
                LocalizationSeedData.LineDescriptionEn(lineSeed.Id) ?? lineSeed.DescriptionOrRouteRange;
            line.DescriptionOrRouteRangeDe = null;
            line.IsVisibleInPublicMenu = true;
            line.GatheringPointsCount = TransportNetworkSeedData.Stations.Count(s => s.TransportLineId == lineSeed.Id);
            line.EstimatedDurationMinutes = lineSeed.EstimatedDurationMinutes;
            line.UpdatedAt = updatedAt;
            linesRestored++;

            _db.UniversityDepartureTimes.RemoveRange(line.UniversityDepartureTimes);
            foreach (var time24 in lineSeed.ReturnDepartureTimes24h)
            {
                line.UniversityDepartureTimes.Add(new UniversityDepartureTime
                {
                    TimeString = TimeDisplayHelper.ToDisplayTime(time24),
                });
            }

            foreach (var stationSeed in TransportNetworkSeedData.Stations.Where(s => s.TransportLineId == lineSeed.Id))
            {
                var station = line.Stations.FirstOrDefault(s => s.Id == stationSeed.Id);
                if (station is null)
                {
                    continue;
                }

                station.StationNumber = stationSeed.StationNumber;
                station.StationName = stationSeed.StationName;
                var stopEn = LocalizationSeedData.StopEn(stationSeed.TransportLineId, stationSeed.StationNumber);
                station.StationNameEn = stopEn?.NameEn ?? stationSeed.StationName;
                station.StationNameDe = null;
                station.DescriptionOrLandmark = stationSeed.DescriptionOrLandmark;
                station.DescriptionOrLandmarkEn = stopEn?.DescEn ?? stationSeed.DescriptionOrLandmark;
                station.DescriptionOrLandmarkDe = null;
                station.DistanceText = string.Empty;
                station.ImagePath = string.Empty;
                station.Latitude = stationSeed.Latitude;
                station.Longitude = stationSeed.Longitude;
                station.GoogleMapsUrl = stationSeed.GoogleMapsUrl;
                station.TrafficStatus = "سالك";
                station.DefaultGatheringTime = stationSeed.GatheringTimes24h.Length > 0
                    ? TimeDisplayHelper.ToDisplayTime(stationSeed.GatheringTimes24h[0])
                    : string.Empty;
                station.AdminNotes = string.Empty;
                stationsRestored++;

                _db.LectureSchedules.RemoveRange(station.LectureSchedules);
                for (var i = 0; i < stationSeed.GatheringTimes24h.Length; i++)
                {
                    station.LectureSchedules.Add(new LectureSchedule
                    {
                        LectureTime = lineSeed.LectureLabels[i],
                        GatheringTime = TimeDisplayHelper.ToDisplayTime(stationSeed.GatheringTimes24h[i]),
                    });
                    lecturesRestored++;
                }
            }
        }

        await _db.SaveChangesAsync(ct).ConfigureAwait(false);

        return new RestoreDefaultsResponse
        {
            LinesRestored = linesRestored,
            StationsRestored = stationsRestored,
            LectureSchedulesRestored = lecturesRestored,
        };
    }

    private static void ApplyUpdate(Station station, UpdateStationRequest request)
    {
        station.StationName = request.StationName.Trim();
        station.StationNameEn = string.IsNullOrWhiteSpace(request.StationNameEn)
            ? request.StationName.Trim()
            : request.StationNameEn.Trim();
        station.StationNameDe = string.IsNullOrWhiteSpace(request.StationNameDe)
            ? null
            : request.StationNameDe.Trim();
        station.DescriptionOrLandmark = request.DescriptionOrLandmark.Trim();
        station.DescriptionOrLandmarkEn = string.IsNullOrWhiteSpace(request.DescriptionOrLandmarkEn)
            ? request.DescriptionOrLandmark.Trim()
            : request.DescriptionOrLandmarkEn.Trim();
        station.DescriptionOrLandmarkDe = string.IsNullOrWhiteSpace(request.DescriptionOrLandmarkDe)
            ? null
            : request.DescriptionOrLandmarkDe.Trim();
        station.DistanceText = request.DistanceText;
        if (!string.IsNullOrWhiteSpace(request.ImagePath))
        {
            station.ImagePath = request.ImagePath;
        }

        station.Latitude = request.Latitude;
        station.Longitude = request.Longitude;
        station.GoogleMapsUrl = string.IsNullOrWhiteSpace(request.GoogleMapsUrl)
            ? $"https://www.google.com/maps?q={request.Latitude},{request.Longitude}"
            : request.GoogleMapsUrl;
        station.TrafficStatus = TrafficStatusMapper.ToArabic(request.TrafficStatusCode);
        station.DefaultGatheringTime = request.DefaultGatheringTime;
        station.AdminNotes = request.AdminNotes;

        if (request.LectureSchedules is { Count: > 0 })
        {
            foreach (var sched in request.LectureSchedules)
            {
                var existing = station.LectureSchedules.FirstOrDefault(l => l.Id == sched.Id);
                if (existing is null)
                {
                    station.LectureSchedules.Add(new LectureSchedule
                    {
                        LectureTime = sched.LectureTime,
                        GatheringTime = sched.GatheringTime,
                    });
                }
                else
                {
                    existing.LectureTime = sched.LectureTime;
                    existing.GatheringTime = sched.GatheringTime;
                }
            }

            var first = station.LectureSchedules.OrderBy(l => l.LectureTime).FirstOrDefault();
            if (first is not null && !string.IsNullOrWhiteSpace(station.DefaultGatheringTime))
            {
                first.GatheringTime = station.DefaultGatheringTime;
            }
        }
    }

    private async Task TouchLineAsync(int lineId, CancellationToken ct)
    {
        var line = await _db.TransportLines.FirstOrDefaultAsync(l => l.Id == lineId, ct).ConfigureAwait(false);
        if (line is not null)
        {
            line.UpdatedAt = DateTime.UtcNow;
            line.GatheringPointsCount = await _db.Stations
                .CountAsync(s => s.TransportLineId == lineId, ct)
                .ConfigureAwait(false);
        }
    }

    private IQueryable<Station> QueryDetailed() =>
        _db.Stations
            .AsNoTracking()
            .Include(s => s.LectureSchedules);
}
