using AlbrigeTransport.Contracts.Auth;
using AlbrigeTransport.Data;
using Microsoft.EntityFrameworkCore;

namespace AlbrigeTransport.Services;

public interface IAuthService
{
    Task<VerifyPasscodeResponse> VerifyPasscodeAsync(string passcode, CancellationToken ct = default);
    Task<(bool Ok, string? ErrorKey)> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken ct = default);
    Task<SessionStatusResponse> GetSessionStatusAsync(string? token, CancellationToken ct = default);
}

public sealed class AuthService : IAuthService
{
    private static readonly TimeSpan SessionLifetime = TimeSpan.FromHours(8);
    private readonly AppDbContext _db;
    private readonly IAdminSessionService _sessions;

    public AuthService(AppDbContext db, IAdminSessionService sessions)
    {
        _db = db;
        _sessions = sessions;
    }

    public async Task<VerifyPasscodeResponse> VerifyPasscodeAsync(string passcode, CancellationToken ct = default)
    {
        var record = await _db.AdminPasscodes.AsNoTracking().FirstOrDefaultAsync(ct).ConfigureAwait(false);
        if (record is null)
        {
            return new VerifyPasscodeResponse { Verified = false };
        }

        var hash = SecurityHashHelper.HashSecret(passcode);
        if (!string.Equals(hash, record.PasscodeHash, StringComparison.OrdinalIgnoreCase))
        {
            return new VerifyPasscodeResponse { Verified = false };
        }

        var expires = DateTime.UtcNow.Add(SessionLifetime);
        var token = _sessions.CreateSession(SessionLifetime);
        return new VerifyPasscodeResponse
        {
            Verified = true,
            SessionToken = token,
            ExpiresAtUtc = expires,
        };
    }

    public async Task<(bool Ok, string? ErrorKey)> ChangePasswordAsync(
        ChangePasswordRequest request,
        CancellationToken ct = default)
    {
        if (request.NewPassword.Trim().Length < 4)
        {
            return (false, "password_weak");
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            return (false, "password_mismatch");
        }

        var security = await _db.AdminSecurities.FirstOrDefaultAsync(ct).ConfigureAwait(false);
        if (security is null)
        {
            security = new Models.AdminSecurity { Id = 1, PasswordHash = SecurityHashHelper.HashSecret("1234") };
            _db.AdminSecurities.Add(security);
        }

        var currentHash = SecurityHashHelper.HashSecret(request.CurrentPassword);
        if (!string.Equals(currentHash, security.PasswordHash, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "password_invalid");
        }

        security.PasswordHash = SecurityHashHelper.HashSecret(request.NewPassword);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return (true, null);
    }

    public Task<SessionStatusResponse> GetSessionStatusAsync(string? token, CancellationToken ct = default)
    {
        var ok = _sessions.TryValidate(token, out var expires);
        return Task.FromResult(new SessionStatusResponse
        {
            IsAuthenticated = ok,
            ExpiresAtUtc = ok ? expires : null,
        });
    }
}
