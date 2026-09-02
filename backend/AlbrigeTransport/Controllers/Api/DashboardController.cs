using AlbrigeTransport.Contracts;
using AlbrigeTransport.Contracts.Dashboard;
using AlbrigeTransport.Filters;
using AlbrigeTransport.Services;
using Microsoft.AspNetCore.Mvc;

namespace AlbrigeTransport.Controllers.Api;

[ApiController]
[Route("api/dashboard")]
[AdminAuthorize]
public sealed class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboard;
    private readonly ILocaleService _locale;

    public DashboardController(IDashboardService dashboard, ILocaleService locale)
    {
        _dashboard = dashboard;
        _locale = locale;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<ApiResult<DashboardOverviewDto>>> Overview(CancellationToken ct)
    {
        var culture = _locale.GetRequestedCulture(HttpContext);
        var data = await _dashboard.GetOverviewAsync(culture, ct).ConfigureAwait(false);
        return Ok(ApiResult<DashboardOverviewDto>.Ok(data));
    }
}
