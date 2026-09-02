using AlbrigeTransport.Contracts.Settings;
using AlbrigeTransport.Contracts.Stations;
using AlbrigeTransport.Contracts.Transport;

namespace AlbrigeTransport.Contracts.Network;

public sealed class NetworkSnapshotDto
{
    public int Version { get; set; } = 1;
    public DateTime UpdatedAt { get; set; }
    public SiteSettingsDto Settings { get; set; } = new();
    public IReadOnlyList<TransportLineDto> Lines { get; set; } = Array.Empty<TransportLineDto>();
    public IReadOnlyList<StationDto> Stations { get; set; } = Array.Empty<StationDto>();
}

public sealed class NetworkSyncRequest
{
    public SiteSettingsDto? Settings { get; set; }
    public IReadOnlyList<TransportLineDto>? Lines { get; set; }
    public IReadOnlyList<StationDto>? Stations { get; set; }
}

public sealed class NetworkSyncResponse
{
    public NetworkSnapshotDto Snapshot { get; set; } = new();
    public bool Synced { get; set; }
}
