using System.Security.Cryptography;
using System.Text;

namespace AlbrigeTransport.Data;

public static class SecurityHashHelper
{
    private const string Prefix = "albridge-admin:";

    public static string HashSecret(string secret) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{Prefix}{secret.Trim()}"))).ToLowerInvariant();

    public const string DefaultPasscodeHash =
        "13474678eaca9647778ea34ad98c59b6ef045cc1713e262902e3e35de455e4a9";
}
