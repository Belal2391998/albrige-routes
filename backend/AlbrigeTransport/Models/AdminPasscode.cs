namespace AlbrigeTransport.Models;

public class AdminPasscode
{
    public int Id { get; set; }

    /// <summary>SHA-256 hex hash of the dashboard lock passcode.</summary>
    public string PasscodeHash { get; set; } = string.Empty;
}
