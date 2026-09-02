using AlbrigeTransport.Contracts;
using AlbrigeTransport.Contracts.Transport;
using AlbrigeTransport.Filters;
using AlbrigeTransport.Services;
using Microsoft.AspNetCore.Mvc;

namespace AlbrigeTransport.Controllers.Api;

[ApiController]
[Route("api/transport-lines")]
public sealed class TransportLinesController : ControllerBase
{
    private readonly ITransportLineService _lines;
    private readonly ILocaleService _locale;

    public TransportLinesController(ITransportLineService lines, ILocaleService locale)
    {
        _lines = lines;
        _locale = locale;
    }

    /// <summary>Public portal: visible lines only (dropdown + cards).</summary>
    [HttpGet("public")]
    public async Task<ActionResult<ApiResult<IReadOnlyList<TransportLineDto>>>> GetPublic(CancellationToken ct)
    {
        var data = await _lines.GetAllAsync(publicOnly: true, ct).ConfigureAwait(false);
        return Ok(ApiResult<IReadOnlyList<TransportLineDto>>.Ok(data));
    }

    [HttpGet]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<IReadOnlyList<TransportLineDto>>>> GetAll(CancellationToken ct)
    {
        var data = await _lines.GetAllAsync(publicOnly: false, ct).ConfigureAwait(false);
        return Ok(ApiResult<IReadOnlyList<TransportLineDto>>.Ok(data));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResult<TransportLineDto>>> GetById(int id, CancellationToken ct)
    {
        var line = await _lines.GetByIdAsync(id, ct).ConfigureAwait(false);
        return line is null
            ? NotFound(ApiResult<TransportLineDto>.Fail("Line not found"))
            : Ok(ApiResult<TransportLineDto>.Ok(line));
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<TransportLineDto>>> Create(
        [FromBody] CreateTransportLineRequest request,
        CancellationToken ct)
    {
        var line = await _lines.CreateAsync(request, ct).ConfigureAwait(false);
        return CreatedAtAction(nameof(GetById), new { id = line.Id }, ApiResult<TransportLineDto>.Ok(line));
    }

    [HttpPut("{id:int}")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<TransportLineDto>>> Update(
        int id,
        [FromBody] UpdateTransportLineRequest request,
        CancellationToken ct)
    {
        var line = await _lines.UpdateAsync(id, request, ct).ConfigureAwait(false);
        return line is null
            ? NotFound(ApiResult<TransportLineDto>.Fail("Line not found"))
            : Ok(ApiResult<TransportLineDto>.Ok(line, _locale.T("saved", _locale.GetRequestedCulture(HttpContext))));
    }

    [HttpDelete("{id:int}")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<object>>> Delete(int id, CancellationToken ct)
    {
        var deleted = await _lines.DeleteAsync(id, ct).ConfigureAwait(false);
        return deleted
            ? Ok(ApiResult<object>.Ok(new { deleted = true }))
            : NotFound(ApiResult<object>.Fail("Line not found"));
    }

    [HttpPatch("{id:int}/visibility")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<TransportLineDto>>> ToggleVisibility(
        int id,
        [FromBody] ToggleLineVisibilityRequest request,
        CancellationToken ct)
    {
        var line = await _lines.ToggleVisibilityAsync(id, request.IsVisibleInPublicMenu, ct).ConfigureAwait(false);
        return line is null
            ? NotFound(ApiResult<TransportLineDto>.Fail("Line not found"))
            : Ok(ApiResult<TransportLineDto>.Ok(line));
    }

    [HttpPut("batch")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<IReadOnlyList<TransportLineDto>>>> BatchSave(
        [FromBody] BatchSaveLinesRequest request,
        CancellationToken ct)
    {
        var lines = await _lines.BatchSaveAsync(request, ct).ConfigureAwait(false);
        return Ok(ApiResult<IReadOnlyList<TransportLineDto>>.Ok(lines, _locale.T("saved", _locale.GetRequestedCulture(HttpContext))));
    }
}
