using AlbrigeTransport.Contracts;
using AlbrigeTransport.Contracts.Auth;
using AlbrigeTransport.Filters;
using AlbrigeTransport.Services;
using Microsoft.AspNetCore.Mvc;

namespace AlbrigeTransport.Controllers.Api;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly ILocaleService _locale;

    public AuthController(IAuthService auth, ILocaleService locale)
    {
        _auth = auth;
        _locale = locale;
    }

    private string Culture => _locale.GetRequestedCulture(HttpContext);

    /// <summary>Verify dashboard PIN — "أدخل رمز الدخول للمتابعة".</summary>
    [HttpPost("passcode/verify")]
    public async Task<ActionResult<ApiResult<VerifyPasscodeResponse>>> VerifyPasscode(
        [FromBody] VerifyPasscodeRequest request,
        CancellationToken ct)
    {
        var result = await _auth.VerifyPasscodeAsync(request.Passcode, ct).ConfigureAwait(false);
        if (!result.Verified)
        {
            return Unauthorized(ApiResult<VerifyPasscodeResponse>.Fail(_locale.T("passcode_invalid", Culture)));
        }

        return Ok(ApiResult<VerifyPasscodeResponse>.Ok(result, _locale.T("saved", Culture)));
    }

    [HttpGet("session")]
    public async Task<ActionResult<ApiResult<SessionStatusResponse>>> SessionStatus(CancellationToken ct)
    {
        var token = Request.Headers[AdminAuthorizeAttribute.HeaderName].FirstOrDefault();
        var status = await _auth.GetSessionStatusAsync(token, ct).ConfigureAwait(false);
        return Ok(ApiResult<SessionStatusResponse>.Ok(status));
    }

    /// <summary>Change admin password — "الأمان وكلمة السر".</summary>
    [HttpPost("password/change")]
    [AdminAuthorize]
    public async Task<ActionResult<ApiResult<object>>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken ct)
    {
        var (ok, errorKey) = await _auth.ChangePasswordAsync(request, ct).ConfigureAwait(false);
        if (!ok)
        {
            return BadRequest(ApiResult<object>.Fail(_locale.T(errorKey ?? "password_invalid", Culture)));
        }

        return Ok(ApiResult<object>.Ok(new { changed = true }, _locale.T("password_changed", Culture)));
    }

    [HttpPost("logout")]
    [AdminAuthorize]
    public ActionResult<ApiResult<object>> Logout()
    {
        var sessions = HttpContext.RequestServices.GetRequiredService<IAdminSessionService>();
        var token = Request.Headers[AdminAuthorizeAttribute.HeaderName].FirstOrDefault();
        sessions.Revoke(token);
        return Ok(ApiResult<object>.Ok(new { loggedOut = true }));
    }
}
