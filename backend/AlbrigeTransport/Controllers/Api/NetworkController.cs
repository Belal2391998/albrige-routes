using AlbrigeTransport.Contracts;
using AlbrigeTransport.Contracts.Network;
using AlbrigeTransport.Filters;
using AlbrigeTransport.Services;
using Microsoft.AspNetCore.Mvc;

namespace AlbrigeTransport.Controllers.Api;

[ApiController]
[Route("api/network")]
public sealed class NetworkController : ControllerBase
{
    /// <summary>Keeps idle connections alive through proxies that time out silently.</summary>
    private static readonly TimeSpan HeartbeatInterval = TimeSpan.FromSeconds(20);

    private readonly INetworkSyncService _sync;
    private readonly ILocaleService _locale;
    private readonly INetworkChangeNotifier _changes;

    public NetworkController(
        INetworkSyncService sync,
        ILocaleService locale,
        INetworkChangeNotifier changes)
    {
        _sync = sync;
        _locale = locale;
        _changes = changes;
    }

    /// <summary>
    /// Server-Sent Events stream that tells clients to refetch. Public on purpose —
    /// the payload is only a timestamp, so listeners learn nothing they could not
    /// already read from the public snapshot.
    /// </summary>
    [HttpGet("stream")]
    public async Task Stream(CancellationToken ct)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache, no-store";
        Response.Headers.Append("X-Accel-Buffering", "no");
        HttpContext.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>()
            ?.DisableBuffering();

        using var subscription = _changes.Subscribe();
        await WriteEventAsync("connected", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), ct)
            .ConfigureAwait(false);

        while (!ct.IsCancellationRequested)
        {
            using var idle = CancellationTokenSource.CreateLinkedTokenSource(ct);
            idle.CancelAfter(HeartbeatInterval);

            try
            {
                if (!await subscription.Reader.WaitToReadAsync(idle.Token).ConfigureAwait(false))
                {
                    break;
                }

                while (subscription.Reader.TryRead(out var tick))
                {
                    await WriteEventAsync("network-changed", tick, ct).ConfigureAwait(false);
                }
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                await Response.WriteAsync(": ping\n\n", ct).ConfigureAwait(false);
                await Response.Body.FlushAsync(ct).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task WriteEventAsync(string name, long tick, CancellationToken ct)
    {
        await Response.WriteAsync($"event: {name}\ndata: {tick}\n\n", ct).ConfigureAwait(false);
        await Response.Body.FlushAsync(ct).ConfigureAwait(false);
    }

    /// <summary>Full network snapshot for public student portal.</summary>
    [HttpGet("snapshot")]
    public async Task<ActionResult<ApiResult<NetworkSnapshotDto>>> GetPublicSnapshot(CancellationToken ct)
    {
        var snapshot = await _sync.GetSnapshotAsync(publicOnly: true, ct).ConfigureAwait(false);
        return Ok(ApiResult<NetworkSnapshotDto>.Ok(snapshot));
    }

    /// <summary>Full network snapshot for admin dashboard (all lines).</summary>
    [HttpGet("snapshot/admin")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<NetworkSnapshotDto>>> GetAdminSnapshot(CancellationToken ct)
    {
        var snapshot = await _sync.GetSnapshotAsync(publicOnly: false, ct).ConfigureAwait(false);
        return Ok(ApiResult<NetworkSnapshotDto>.Ok(snapshot));
    }

    /// <summary>Two-way sync — push admin changes and receive authoritative snapshot.</summary>
    [HttpPut("sync")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<NetworkSyncResponse>>> Sync(
        [FromBody] NetworkSyncRequest request,
        CancellationToken ct)
    {
        var culture = _locale.GetRequestedCulture(HttpContext);
        var result = await _sync.SyncAsync(request, ct).ConfigureAwait(false);
        return Ok(ApiResult<NetworkSyncResponse>.Ok(result, _locale.T("saved", culture)));
    }
}
