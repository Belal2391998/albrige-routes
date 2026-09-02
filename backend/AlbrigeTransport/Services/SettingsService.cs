using AlbrigeTransport.Contracts.Settings;
using AlbrigeTransport.Data;
using AlbrigeTransport.Models;
using Microsoft.EntityFrameworkCore;

namespace AlbrigeTransport.Services;

public interface ISettingsService
{
    Task<SiteSettingsDto> GetAsync(CancellationToken ct = default);
    Task<SiteSettingsDto> UpdateAsync(UpdateSiteSettingsRequest request, CancellationToken ct = default);
    LocalizationInfoDto GetLocalizationInfo(string culture);
}

public sealed class SettingsService : ISettingsService
{
    private readonly AppDbContext _db;
    private readonly ILocaleService _locale;

    public SettingsService(AppDbContext db, ILocaleService locale)
    {
        _db = db;
        _locale = locale;
    }

    public async Task<SiteSettingsDto> GetAsync(CancellationToken ct = default)
    {
        var settings = await GetOrCreateSettingsAsync(ct).ConfigureAwait(false);
        return EntityMapper.ToSettingsDto(settings);
    }

    public async Task<SiteSettingsDto> UpdateAsync(UpdateSiteSettingsRequest request, CancellationToken ct = default)
    {
        var settings = await GetOrCreateSettingsAsync(ct).ConfigureAwait(false);
        settings.ShowScheduleTimes = request.ShowScheduleTimes;
        if (!string.IsNullOrWhiteSpace(request.StatusBadgeText))
        {
            settings.StatusBadgeText = request.StatusBadgeText.Trim();
        }

        settings.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return EntityMapper.ToSettingsDto(settings);
    }

    public LocalizationInfoDto GetLocalizationInfo(string culture)
    {
        var keys = new[] { "sync_live", "passcode_prompt", "show_schedule_times", "saved", "restored" };
        var labels = keys.ToDictionary(k => k, k => _locale.T(k, culture), StringComparer.Ordinal);
        return new LocalizationInfoDto
        {
            RequestedCulture = culture,
            Labels = labels,
        };
    }

    private async Task<SiteSettings> GetOrCreateSettingsAsync(CancellationToken ct)
    {
        var settings = await _db.SiteSettings
            .OrderBy(s => s.Id)
            .FirstOrDefaultAsync(ct)
            .ConfigureAwait(false);
        if (settings is not null)
        {
            return settings;
        }

        settings = new SiteSettings
        {
            Id = 1,
            ShowScheduleTimes = true,
            StatusBadgeText = "سالك",
            UpdatedAt = DateTime.UtcNow,
        };
        _db.SiteSettings.Add(settings);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return settings;
    }
}
