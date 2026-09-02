using AlbrigeTransport.Contracts;
using AlbrigeTransport.Contracts.Settings;
using AlbrigeTransport.Filters;
using AlbrigeTransport.Services;
using Microsoft.AspNetCore.Mvc;

namespace AlbrigeTransport.Controllers.Api;

[ApiController]
[Route("api/settings")]
public sealed class SettingsController : ControllerBase
{
    private readonly ISettingsService _settings;
    private readonly ILocaleService _locale;

    public SettingsController(ISettingsService settings, ILocaleService locale)
    {
        _settings = settings;
        _locale = locale;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResult<SiteSettingsDto>>> Get(CancellationToken ct)
    {
        var data = await _settings.GetAsync(ct).ConfigureAwait(false);
        return Ok(ApiResult<SiteSettingsDto>.Ok(data));
    }

    /// <summary>Toggle إظهار أوقات الدوام — reflects instantly on public portal.</summary>
    [HttpPut]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<SiteSettingsDto>>> Update(
        [FromBody] UpdateSiteSettingsRequest request,
        CancellationToken ct)
    {
        var culture = _locale.GetRequestedCulture(HttpContext);
        var data = await _settings.UpdateAsync(request, ct).ConfigureAwait(false);
        return Ok(ApiResult<SiteSettingsDto>.Ok(data, _locale.T("saved", culture)));
    }

    [HttpGet("localization")]
    public ActionResult<ApiResult<LocalizationInfoDto>> Localization()
    {
        var culture = _locale.GetRequestedCulture(HttpContext);
        var data = _settings.GetLocalizationInfo(culture);
        return Ok(ApiResult<LocalizationInfoDto>.Ok(data));
    }
}
