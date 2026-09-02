using AlbrigeTransport.Contracts;
using AlbrigeTransport.Contracts.Stations;
using AlbrigeTransport.Filters;
using AlbrigeTransport.Services;
using Microsoft.AspNetCore.Mvc;

namespace AlbrigeTransport.Controllers.Api;

[ApiController]
[Route("api/stations")]
public sealed class StationsController : ControllerBase
{
    private readonly IStationService _stations;
    private readonly ILocaleService _locale;

    public StationsController(IStationService stations, ILocaleService locale)
    {
        _stations = stations;
        _locale = locale;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResult<IReadOnlyList<StationDto>>>> GetByLine(
        [FromQuery] int lineId,
        CancellationToken ct)
    {
        var data = await _stations.GetByLineAsync(lineId, ct).ConfigureAwait(false);
        return Ok(ApiResult<IReadOnlyList<StationDto>>.Ok(data));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResult<StationDto>>> GetById(int id, CancellationToken ct)
    {
        var station = await _stations.GetByIdAsync(id, ct).ConfigureAwait(false);
        return station is null
            ? NotFound(ApiResult<StationDto>.Fail("Station not found"))
            : Ok(ApiResult<StationDto>.Ok(station));
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<StationDto>>> Create(
        [FromBody] CreateStationRequest request,
        CancellationToken ct)
    {
        try
        {
            var station = await _stations.CreateAsync(request, ct).ConfigureAwait(false);
            return Ok(ApiResult<StationDto>.Ok(station, _locale.T("saved", _locale.GetRequestedCulture(HttpContext))));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResult<StationDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<StationDto>>> Update(
        int id,
        [FromBody] UpdateStationRequest request,
        CancellationToken ct)
    {
        var station = await _stations.UpdateAsync(id, request, ct).ConfigureAwait(false);
        return station is null
            ? NotFound(ApiResult<StationDto>.Fail("Station not found"))
            : Ok(ApiResult<StationDto>.Ok(station, _locale.T("saved", _locale.GetRequestedCulture(HttpContext))));
    }

    /// <summary>حفظ كل المحطات — batch save for a line.</summary>
    [HttpPut("batch/{lineId:int}")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<IReadOnlyList<StationDto>>>> BatchSave(
        int lineId,
        [FromBody] BatchSaveStationsRequest request,
        CancellationToken ct)
    {
        var stations = await _stations.BatchSaveByLineAsync(lineId, request, ct).ConfigureAwait(false);
        return Ok(ApiResult<IReadOnlyList<StationDto>>.Ok(stations, _locale.T("saved", _locale.GetRequestedCulture(HttpContext))));
    }

    /// <summary>
    /// The dashboard resizes before uploading, so payloads are well under a
    /// megabyte. The generous limit only covers clients that skip compression.
    /// </summary>
    [HttpPost("{id:int}/image")]
    [AdminAuthorize]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult<ApiResult<StationImageUploadResponse>>> UploadImage(
        int id,
        IFormFile file,
        CancellationToken ct)
    {
        var result = await _stations.UploadImageAsync(id, file, ct).ConfigureAwait(false);
        if (result is null)
        {
            return BadRequest(ApiResult<StationImageUploadResponse>.Fail("Invalid station or file"));
        }

        // The dashboard runs on a different origin, so a relative path would resolve
        // against the frontend and 404. The query string busts the browser cache when
        // a replacement photo reuses the same file name.
        var origin = $"{Request.Scheme}://{Request.Host}";
        result.PublicUrl = $"{origin}{result.ImagePath}?v={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

        return Ok(ApiResult<StationImageUploadResponse>.Ok(result));
    }

    /// <summary>استعادة كل الجداول — restore default seed data.</summary>
    [HttpPost("restore-defaults")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<RestoreDefaultsResponse>>> RestoreDefaults(CancellationToken ct)
    {
        var result = await _stations.RestoreDefaultsAsync(ct).ConfigureAwait(false);
        return Ok(ApiResult<RestoreDefaultsResponse>.Ok(result, _locale.T("restored", _locale.GetRequestedCulture(HttpContext))));
    }
}
