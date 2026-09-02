using AlbrigeTransport.Services;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AlbrigeTransport.Filters;

/// <summary>
/// Fires a Server-Sent Event after any successful write to the network data, so new
/// endpoints get live push without having to remember to notify by hand. Auth routes
/// are skipped: signing in changes no data students can see.
/// </summary>
public sealed class NotifyNetworkChangeFilter : IAsyncActionFilter
{
    private static readonly string[] WatchedPaths =
    [
        "/api/stations",
        "/api/transport-lines",
        "/api/settings",
        "/api/network",
    ];

    private readonly INetworkChangeNotifier _notifier;

    public NotifyNetworkChangeFilter(INetworkChangeNotifier notifier)
    {
        _notifier = notifier;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next().ConfigureAwait(false);

        if (executed.Exception is not null && !executed.ExceptionHandled)
        {
            return;
        }

        var request = executed.HttpContext.Request;
        if (!IsMutating(request.Method))
        {
            return;
        }

        var path = request.Path.Value;
        if (string.IsNullOrEmpty(path) || !WatchedPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            return;
        }

        var status = executed.HttpContext.Response.StatusCode;
        if (status is >= 200 and < 300)
        {
            _notifier.Notify();
        }
    }

    private static bool IsMutating(string method) =>
        HttpMethods.IsPost(method)
        || HttpMethods.IsPut(method)
        || HttpMethods.IsPatch(method)
        || HttpMethods.IsDelete(method);
}
