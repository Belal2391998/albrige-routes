namespace AlbrigeTransport.Models;

public class AdminSecurity
{
    public int Id { get; set; }

    /// <summary>SHA-256 hex hash of the admin panel password.</summary>
    public string PasswordHash { get; set; } = string.Empty;
}
