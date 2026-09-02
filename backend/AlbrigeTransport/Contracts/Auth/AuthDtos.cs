namespace AlbrigeTransport.Contracts.Auth;

public sealed class VerifyPasscodeRequest
{
    public string Passcode { get; set; } = string.Empty;
}

public sealed class VerifyPasscodeResponse
{
    public bool Verified { get; set; }
    public string? SessionToken { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}

public sealed class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public sealed class SessionStatusResponse
{
    public bool IsAuthenticated { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}
