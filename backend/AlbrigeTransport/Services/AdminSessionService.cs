using System.Collections.Concurrent;

namespace AlbrigeTransport.Services;

public interface IAdminSessionService
{
    string CreateSession(TimeSpan lifetime);
    bool TryValidate(string? token, out DateTime expiresAtUtc);
    void Revoke(string? token);
}

public sealed class AdminSessionService : IAdminSessionService
{
    private readonly ConcurrentDictionary<string, DateTime> _sessions = new();

    public string CreateSession(TimeSpan lifetime)
    {
        var token = Guid.NewGuid().ToString("N");
        var expires = DateTime.UtcNow.Add(lifetime);
        _sessions[token] = expires;
        return token;
    }

    public bool TryValidate(string? token, out DateTime expiresAtUtc)
    {
        expiresAtUtc = default;
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        if (!_sessions.TryGetValue(token, out expiresAtUtc))
        {
            return false;
        }

        if (expiresAtUtc <= DateTime.UtcNow)
        {
            _sessions.TryRemove(token, out _);
            return false;
        }

        return true;
    }

    public void Revoke(string? token)
    {
        if (!string.IsNullOrWhiteSpace(token))
        {
            _sessions.TryRemove(token, out _);
        }
    }
}
