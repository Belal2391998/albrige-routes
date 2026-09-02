using AlbrigeTransport.Models;
using Microsoft.EntityFrameworkCore;

namespace AlbrigeTransport.Data;

public static class DbSeed
{
    public static void ApplySeedData(ModelBuilder modelBuilder)
    {
        var updatedAt = TransportNetworkSeedData.UpdatedAt;

        modelBuilder.Entity<AdminPasscode>().HasData(new AdminPasscode
        {
            Id = 1,
            PasscodeHash = SecurityHashHelper.DefaultPasscodeHash,
        });

        modelBuilder.Entity<AdminSecurity>().HasData(new AdminSecurity
        {
            Id = 1,
            PasswordHash = SecurityHashHelper.DefaultPasscodeHash,
        });

        modelBuilder.Entity<SiteSettings>().HasData(new SiteSettings
        {
            Id = 1,
            ShowScheduleTimes = true,
            StatusBadgeText = "سالك",
            UpdatedAt = updatedAt,
        });

        var lines = TransportNetworkSeedData.Lines
            .Select(line => new TransportLine
            {
                Id = line.Id,
                LineNumber = line.LineNumber,
                LineName = line.LineName,
                LineNameEn = LocalizationSeedData.LineNameEn(line.Id) ?? line.LineName,
                LineNameDe = null,
                Slug = line.Slug,
                DescriptionOrRouteRange = line.DescriptionOrRouteRange,
                DescriptionOrRouteRangeEn =
                    LocalizationSeedData.LineDescriptionEn(line.Id) ?? line.DescriptionOrRouteRange,
                DescriptionOrRouteRangeDe = null,
                IsVisibleInPublicMenu = true,
                GatheringPointsCount = TransportNetworkSeedData.Stations.Count(s => s.TransportLineId == line.Id),
                EstimatedDurationMinutes = line.EstimatedDurationMinutes,
                UpdatedAt = updatedAt,
            })
            .ToArray();

        modelBuilder.Entity<TransportLine>().HasData(lines);

        var stations = TransportNetworkSeedData.Stations
            .Select(s =>
            {
                var stopEn = LocalizationSeedData.StopEn(s.TransportLineId, s.StationNumber);
                return new Station
                {
                    Id = s.Id,
                    TransportLineId = s.TransportLineId,
                    StationNumber = s.StationNumber,
                    StationName = s.StationName,
                    StationNameEn = stopEn?.NameEn ?? s.StationName,
                    StationNameDe = null,
                    DescriptionOrLandmark = s.DescriptionOrLandmark,
                    DescriptionOrLandmarkEn = stopEn?.DescEn ?? s.DescriptionOrLandmark,
                    DescriptionOrLandmarkDe = null,
                DistanceText = string.Empty,
                ImagePath = string.Empty,
                Latitude = s.Latitude,
                Longitude = s.Longitude,
                GoogleMapsUrl = s.GoogleMapsUrl,
                TrafficStatus = "سالك",
                DefaultGatheringTime = s.GatheringTimes24h.Length > 0
                    ? TimeDisplayHelper.ToDisplayTime(s.GatheringTimes24h[0])
                    : string.Empty,
                AdminNotes = string.Empty,
                };
            })
            .ToArray();

        modelBuilder.Entity<Station>().HasData(stations);

        var departureTimes = new List<UniversityDepartureTime>();
        var departureId = 1;
        foreach (var line in TransportNetworkSeedData.Lines)
        {
            foreach (var time24 in line.ReturnDepartureTimes24h)
            {
                departureTimes.Add(new UniversityDepartureTime
                {
                    Id = departureId++,
                    TransportLineId = line.Id,
                    TimeString = TimeDisplayHelper.ToDisplayTime(time24),
                });
            }
        }

        modelBuilder.Entity<UniversityDepartureTime>().HasData(departureTimes);

        var lectureSchedules = new List<LectureSchedule>();
        var lectureId = 1;
        foreach (var station in TransportNetworkSeedData.Stations)
        {
            var line = TransportNetworkSeedData.GetLine(station.TransportLineId);
            for (var i = 0; i < station.GatheringTimes24h.Length; i++)
            {
                lectureSchedules.Add(new LectureSchedule
                {
                    Id = lectureId++,
                    StationId = station.Id,
                    LectureTime = line.LectureLabels[i],
                    GatheringTime = TimeDisplayHelper.ToDisplayTime(station.GatheringTimes24h[i]),
                });
            }
        }

        modelBuilder.Entity<LectureSchedule>().HasData(lectureSchedules);
    }

    /// <summary>
    /// Runtime fallback seeder when migrations have not been applied yet.
    /// </summary>
    public static async Task EnsureSeededAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        var migrations = context.Database.GetMigrations();
        if (migrations.Any())
        {
            await context.Database.MigrateAsync(cancellationToken).ConfigureAwait(false);
            await BackfillLocalizationsAsync(context, cancellationToken).ConfigureAwait(false);
        }
        else
        {
            await context.Database.EnsureCreatedAsync(cancellationToken).ConfigureAwait(false);
        }

        if (await context.TransportLines.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var updatedAt = TransportNetworkSeedData.UpdatedAt;

        context.AdminPasscodes.Add(new AdminPasscode
        {
            Id = 1,
            PasscodeHash = SecurityHashHelper.HashSecret("1234"),
        });

        context.AdminSecurities.Add(new AdminSecurity
        {
            Id = 1,
            PasswordHash = SecurityHashHelper.HashSecret("1234"),
        });

        context.SiteSettings.Add(new SiteSettings
        {
            Id = 1,
            ShowScheduleTimes = true,
            StatusBadgeText = "سالك",
            UpdatedAt = updatedAt,
        });

        foreach (var lineSeed in TransportNetworkSeedData.Lines)
        {
            var line = new TransportLine
            {
                Id = lineSeed.Id,
                LineNumber = lineSeed.LineNumber,
                LineName = lineSeed.LineName,
                LineNameEn = LocalizationSeedData.LineNameEn(lineSeed.Id) ?? lineSeed.LineName,
                LineNameDe = null,
                Slug = lineSeed.Slug,
                DescriptionOrRouteRange = lineSeed.DescriptionOrRouteRange,
                DescriptionOrRouteRangeEn =
                    LocalizationSeedData.LineDescriptionEn(lineSeed.Id) ?? lineSeed.DescriptionOrRouteRange,
                DescriptionOrRouteRangeDe = null,
                IsVisibleInPublicMenu = true,
                GatheringPointsCount = TransportNetworkSeedData.Stations.Count(s => s.TransportLineId == lineSeed.Id),
                EstimatedDurationMinutes = lineSeed.EstimatedDurationMinutes,
                UpdatedAt = updatedAt,
            };

            foreach (var time24 in lineSeed.ReturnDepartureTimes24h)
            {
                line.UniversityDepartureTimes.Add(new UniversityDepartureTime
                {
                    TimeString = TimeDisplayHelper.ToDisplayTime(time24),
                });
            }

            foreach (var stationSeed in TransportNetworkSeedData.Stations.Where(s => s.TransportLineId == lineSeed.Id))
            {
                var station = new Station
                {
                    Id = stationSeed.Id,
                    StationNumber = stationSeed.StationNumber,
                    StationName = stationSeed.StationName,
                    StationNameEn = LocalizationSeedData.StopEn(stationSeed.TransportLineId, stationSeed.StationNumber)?.NameEn
                        ?? stationSeed.StationName,
                    StationNameDe = null,
                    DescriptionOrLandmark = stationSeed.DescriptionOrLandmark,
                    DescriptionOrLandmarkEn = LocalizationSeedData.StopEn(stationSeed.TransportLineId, stationSeed.StationNumber)?.DescEn
                        ?? stationSeed.DescriptionOrLandmark,
                    DescriptionOrLandmarkDe = null,
                    DistanceText = string.Empty,
                    ImagePath = string.Empty,
                    Latitude = stationSeed.Latitude,
                    Longitude = stationSeed.Longitude,
                    GoogleMapsUrl = stationSeed.GoogleMapsUrl,
                    TrafficStatus = "سالك",
                    DefaultGatheringTime = stationSeed.GatheringTimes24h.Length > 0
                        ? TimeDisplayHelper.ToDisplayTime(stationSeed.GatheringTimes24h[0])
                        : string.Empty,
                    AdminNotes = string.Empty,
                };

                for (var i = 0; i < stationSeed.GatheringTimes24h.Length; i++)
                {
                    station.LectureSchedules.Add(new LectureSchedule
                    {
                        LectureTime = lineSeed.LectureLabels[i],
                        GatheringTime = TimeDisplayHelper.ToDisplayTime(stationSeed.GatheringTimes24h[i]),
                    });
                }

                line.Stations.Add(station);
            }

            context.TransportLines.Add(line);
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// Fills English columns on databases created before localized columns existed.
    /// </summary>
    public static async Task BackfillLocalizationsAsync(
        AppDbContext context,
        CancellationToken cancellationToken = default)
    {
        var lines = await context.TransportLines.ToListAsync(cancellationToken).ConfigureAwait(false);
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line.LineNameEn) || line.LineNameEn == line.LineName)
            {
                line.LineNameEn = LocalizationSeedData.LineNameEn(line.Id) ?? line.LineName;
            }

            if (string.IsNullOrWhiteSpace(line.DescriptionOrRouteRangeEn)
                || line.DescriptionOrRouteRangeEn == line.DescriptionOrRouteRange)
            {
                line.DescriptionOrRouteRangeEn =
                    LocalizationSeedData.LineDescriptionEn(line.Id) ?? line.DescriptionOrRouteRange;
            }
        }

        var stations = await context.Stations.ToListAsync(cancellationToken).ConfigureAwait(false);
        foreach (var station in stations)
        {
            var stopEn = LocalizationSeedData.StopEn(station.TransportLineId, station.StationNumber);
            if (stopEn is null)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(station.StationNameEn) || station.StationNameEn == station.StationName)
            {
                station.StationNameEn = stopEn.Value.NameEn;
            }

            if (string.IsNullOrWhiteSpace(station.DescriptionOrLandmarkEn)
                || station.DescriptionOrLandmarkEn == station.DescriptionOrLandmark)
            {
                station.DescriptionOrLandmarkEn = stopEn.Value.DescEn;
            }
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
