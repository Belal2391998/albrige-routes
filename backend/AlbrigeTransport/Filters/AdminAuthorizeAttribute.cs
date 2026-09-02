using AlbrigeTransport.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AlbrigeTransport.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class AdminAuthorizeAttribute : Attribute, IAsyncAuthorizationFilter
{
    public const string HeaderName = "X-Admin-Session";

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var sessions = context.HttpContext.RequestServices.GetRequiredService<IAdminSessionService>();
        var locale = context.HttpContext.RequestServices.GetRequiredService<ILocaleService>();
        var culture = locale.GetRequestedCulture(context.HttpContext);

        var token = context.HttpContext.Request.Headers[HeaderName].FirstOrDefault()
            ?? context.HttpContext.Request.Headers.Authorization.FirstOrDefault()?.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);

        if (sessions.TryValidate(token, out _))
        {
            return;
        }

        context.Result = new UnauthorizedObjectResult(new
        {
            success = false,
            error = locale.T("unauthorized", culture),
        });

        await Task.CompletedTask;
    }
}
