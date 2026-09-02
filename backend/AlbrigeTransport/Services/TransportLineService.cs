using AlbrigeTransport.Contracts.Transport;
using AlbrigeTransport.Data;
using AlbrigeTransport.Models;
using Microsoft.EntityFrameworkCore;

namespace AlbrigeTransport.Services;

public interface ITransportLineService
{
    Task<IReadOnlyList<TransportLineDto>> GetAllAsync(bool publicOnly = false, CancellationToken ct = default);
    Task<TransportLineDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TransportLineDto> CreateAsync(CreateTransportLineRequest request, CancellationToken ct = default);
    Task<TransportLineDto?> UpdateAsync(int id, UpdateTransportLineRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<TransportLineDto?> ToggleVisibilityAsync(int id, bool isVisible, CancellationToken ct = default);
    Task<IReadOnlyList<TransportLineDto>> BatchSaveAsync(BatchSaveLinesRequest request, CancellationToken ct = default);
}

public sealed class TransportLineService : ITransportLineService
{
    private readonly AppDbContext _db;

    public TransportLineService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<TransportLineDto>> GetAllAsync(bool publicOnly = false, CancellationToken ct = default)
    {
        var query = _db.TransportLines
            .AsNoTracking()
            .Include(l => l.UniversityDepartureTimes)
            .Include(l => l.Stations)
            .AsQueryable();

        if (publicOnly)
        {
            query = query.Where(l => l.IsVisibleInPublicMenu);
        }

        var lines = await query.OrderBy(l => l.LineNumber).ToListAsync(ct).ConfigureAwait(false);
        return lines.Select(l => EntityMapper.ToLineDto(l)).ToArray();
    }

    public async Task<TransportLineDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var line = await QueryDetailed().FirstOrDefaultAsync(l => l.Id == id, ct).ConfigureAwait(false);
        return line is null ? null : EntityMapper.ToLineDto(line);
    }

    public async Task<TransportLineDto> CreateAsync(CreateTransportLineRequest request, CancellationToken ct = default)
    {
        var line = new TransportLine
        {
            LineNumber = request.LineNumber,
            LineName = request.LineName.Trim(),
            LineNameEn = string.IsNullOrWhiteSpace(request.LineNameEn)
                ? request.LineName.Trim()
                : request.LineNameEn.Trim(),
            LineNameDe = string.IsNullOrWhiteSpace(request.LineNameDe) ? null : request.LineNameDe.Trim(),
            Slug = request.Slug.Trim(),
            DescriptionOrRouteRange = request.DescriptionOrRouteRange.Trim(),
            DescriptionOrRouteRangeEn = string.IsNullOrWhiteSpace(request.DescriptionOrRouteRangeEn)
                ? request.DescriptionOrRouteRange.Trim()
                : request.DescriptionOrRouteRangeEn.Trim(),
            DescriptionOrRouteRangeDe = string.IsNullOrWhiteSpace(request.DescriptionOrRouteRangeDe)
                ? null
                : request.DescriptionOrRouteRangeDe.Trim(),
            IsVisibleInPublicMenu = request.IsVisibleInPublicMenu,
            GatheringPointsCount = 0,
            EstimatedDurationMinutes = request.EstimatedDurationMinutes,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.TransportLines.Add(line);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return EntityMapper.ToLineDto(line);
    }

    public async Task<TransportLineDto?> UpdateAsync(int id, UpdateTransportLineRequest request, CancellationToken ct = default)
    {
        var line = await _db.TransportLines.FirstOrDefaultAsync(l => l.Id == id, ct).ConfigureAwait(false);
        if (line is null)
        {
            return null;
        }

        line.LineName = request.LineName.Trim();
        line.LineNameEn = string.IsNullOrWhiteSpace(request.LineNameEn)
            ? request.LineName.Trim()
            : request.LineNameEn.Trim();
        line.LineNameDe = string.IsNullOrWhiteSpace(request.LineNameDe) ? null : request.LineNameDe.Trim();
        line.Slug = request.Slug.Trim();
        line.DescriptionOrRouteRange = request.DescriptionOrRouteRange.Trim();
        line.DescriptionOrRouteRangeEn = string.IsNullOrWhiteSpace(request.DescriptionOrRouteRangeEn)
            ? request.DescriptionOrRouteRange.Trim()
            : request.DescriptionOrRouteRangeEn.Trim();
        line.DescriptionOrRouteRangeDe = string.IsNullOrWhiteSpace(request.DescriptionOrRouteRangeDe)
            ? null
            : request.DescriptionOrRouteRangeDe.Trim();
        line.IsVisibleInPublicMenu = request.IsVisibleInPublicMenu;
        line.EstimatedDurationMinutes = request.EstimatedDurationMinutes;
        line.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return EntityMapper.ToLineDto(await QueryDetailed().FirstAsync(l => l.Id == id, ct).ConfigureAwait(false));
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var line = await _db.TransportLines.FirstOrDefaultAsync(l => l.Id == id, ct).ConfigureAwait(false);
        if (line is null)
        {
            return false;
        }

        _db.TransportLines.Remove(line);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return true;
    }

    public async Task<TransportLineDto?> ToggleVisibilityAsync(int id, bool isVisible, CancellationToken ct = default)
    {
        var line = await _db.TransportLines.FirstOrDefaultAsync(l => l.Id == id, ct).ConfigureAwait(false);
        if (line is null)
        {
            return null;
        }

        line.IsVisibleInPublicMenu = isVisible;
        line.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return EntityMapper.ToLineDto(await QueryDetailed().FirstAsync(l => l.Id == id, ct).ConfigureAwait(false));
    }

    public async Task<IReadOnlyList<TransportLineDto>> BatchSaveAsync(
        BatchSaveLinesRequest request,
        CancellationToken ct = default)
    {
        var ids = request.Lines.Select(l => l.Id).ToArray();
        var lines = await _db.TransportLines.Where(l => ids.Contains(l.Id)).ToListAsync(ct).ConfigureAwait(false);

        foreach (var item in request.Lines)
        {
            var line = lines.FirstOrDefault(l => l.Id == item.Id);
            if (line is null)
            {
                continue;
            }

            line.LineName = item.LineName.Trim();
            line.LineNameEn = string.IsNullOrWhiteSpace(item.LineNameEn)
                ? item.LineName.Trim()
                : item.LineNameEn.Trim();
            if (item.LineNameDe is not null)
            {
                line.LineNameDe = string.IsNullOrWhiteSpace(item.LineNameDe) ? null : item.LineNameDe.Trim();
            }

            line.Slug = item.Slug.Trim();
            line.DescriptionOrRouteRange = item.DescriptionOrRouteRange.Trim();
            line.DescriptionOrRouteRangeEn = string.IsNullOrWhiteSpace(item.DescriptionOrRouteRangeEn)
                ? item.DescriptionOrRouteRange.Trim()
                : item.DescriptionOrRouteRangeEn.Trim();
            if (item.DescriptionOrRouteRangeDe is not null)
            {
                line.DescriptionOrRouteRangeDe = string.IsNullOrWhiteSpace(item.DescriptionOrRouteRangeDe)
                    ? null
                    : item.DescriptionOrRouteRangeDe.Trim();
            }
            line.IsVisibleInPublicMenu = item.IsVisibleInPublicMenu;
            line.EstimatedDurationMinutes = item.EstimatedDurationMinutes;
            line.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return await GetAllAsync(false, ct).ConfigureAwait(false);
    }

    private IQueryable<TransportLine> QueryDetailed() =>
        _db.TransportLines
            .AsNoTracking()
            .Include(l => l.UniversityDepartureTimes)
            .Include(l => l.Stations);
}
