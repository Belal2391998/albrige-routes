using AlbrigeTransport.Contracts;
using AlbrigeTransport.Contracts.Auth;
using AlbrigeTransport.Services;
using Microsoft.AspNetCore.Mvc;

namespace AlbrigeTransport.Controllers.Api;

/// <summary>
/// Passcode entry endpoints — alias surface for dashboard lock UI.
/// </summary>
[ApiController]
[Route("api/passcode")]
public sealed class PasscodeController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly ILocaleService _locale;

    public PasscodeController(IAuthService auth, ILocaleService locale)
    {
        _auth = auth;
        _locale = locale;
    }

    [HttpPost("verify")]
    public async Task<ActionResult<ApiResult<VerifyPasscodeResponse>>> Verify(
        [FromBody] VerifyPasscodeRequest request,
        CancellationToken ct)
    {
        var culture = _locale.GetRequestedCulture(HttpContext);
        var result = await _auth.VerifyPasscodeAsync(request.Passcode, ct).ConfigureAwait(false);
        if (!result.Verified)
        {
            return Unauthorized(ApiResult<VerifyPasscodeResponse>.Fail(_locale.T("passcode_invalid", culture)));
        }

        return Ok(ApiResult<VerifyPasscodeResponse>.Ok(result));
    }
}
