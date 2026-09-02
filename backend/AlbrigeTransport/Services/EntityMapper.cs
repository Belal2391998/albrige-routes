using AlbrigeTransport.Contracts;
using AlbrigeTransport.Contracts.Settings;
using AlbrigeTransport.Contracts.Stations;
using AlbrigeTransport.Contracts.Transport;
using AlbrigeTransport.Models;

namespace AlbrigeTransport.Services;

public static class EntityMapper
{
    public static LocalizedTextDto ToLocalized(string ar, string? en = null, string? de = null) =>
        new()
        {
            Ar = ar,
            En = string.IsNullOrWhiteSpace(en) ? ar : en,
            De = de,
        };

    public static TransportLineDto ToLineDto(TransportLine line, bool includeDepartures = true)
    {
        var dto = new TransportLineDto
        {
            Id = line.Id,
            LineNumber = line.LineNumber,
            Name = ToLocalized(line.LineName, line.LineNameEn, line.LineNameDe),
            Slug = line.Slug,
            DescriptionOrRouteRange = ToLocalized(
                line.DescriptionOrRouteRange,
                line.DescriptionOrRouteRangeEn,
                line.DescriptionOrRouteRangeDe),
            Badge = ToLocalized($"الخط {ToArabicOrdinal(line.LineNumber)}", $"Line {line.LineNumber}"),
            IsVisibleInPublicMenu = line.IsVisibleInPublicMenu,
            GatheringPointsCount = line.GatheringPointsCount,
            EstimatedDurationMinutes = line.EstimatedDurationMinutes,
            UpdatedAt = line.UpdatedAt,
            StationCount = line.Stations?.Count ?? 0,
        };

        if (includeDepartures && line.UniversityDepartureTimes is { Count: > 0 })
        {
            dto.ReturnDepartureTimes = line.UniversityDepartureTimes
                .Select(d => d.TimeString)
                .ToArray();
        }

        return dto;
    }

    public static StationDto ToStationDto(Station station) =>
        new()
        {
            Id = station.Id,
            TransportLineId = station.TransportLineId,
            StationNumber = station.StationNumber,
            Name = ToLocalized(station.StationName, station.StationNameEn, station.StationNameDe),
            DescriptionOrLandmark = ToLocalized(
                station.DescriptionOrLandmark,
                station.DescriptionOrLandmarkEn,
                station.DescriptionOrLandmarkDe),
            DistanceText = station.DistanceText,
            ImagePath = station.ImagePath,
            Latitude = station.Latitude,
            Longitude = station.Longitude,
            GoogleMapsUrl = station.GoogleMapsUrl,
            TrafficStatus = station.TrafficStatus,
            TrafficStatusCode = TrafficStatusMapper.ToCode(station.TrafficStatus),
            DefaultGatheringTime = station.DefaultGatheringTime,
            AdminNotes = station.AdminNotes,
            LectureSchedules = station.LectureSchedules
                .OrderBy(l => l.LectureTime)
                .Select(l => new LectureScheduleDto
                {
                    Id = l.Id,
                    LectureTime = l.LectureTime,
                    GatheringTime = l.GatheringTime,
                })
                .ToArray(),
        };

    public static SiteSettingsDto ToSettingsDto(SiteSettings settings) =>
        new()
        {
            ShowScheduleTimes = settings.ShowScheduleTimes,
            StatusBadgeText = settings.StatusBadgeText,
            UpdatedAt = settings.UpdatedAt,
        };

    private static string ToArabicOrdinal(int n) => n switch
    {
        1 => "الأول",
        2 => "الثاني",
        3 => "الثالث",
        4 => "الرابع",
        5 => "الخامس",
        _ => n.ToString(),
    };
}
