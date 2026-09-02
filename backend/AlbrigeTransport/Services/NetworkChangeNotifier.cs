using System.Collections.Concurrent;
using System.Threading.Channels;

namespace AlbrigeTransport.Services;

public interface INetworkChangeSubscription : IDisposable
{
    ChannelReader<long> Reader { get; }
}

public interface INetworkChangeNotifier
{
    /// <summary>Tells every connected client that the network data changed.</summary>
    void Notify();

    INetworkChangeSubscription Subscribe();
}

/// <summary>
/// Fan-out for Server-Sent Events. Registered as a singleton so an admin save on one
/// device can push a refresh hint to every student device that is currently connected.
/// </summary>
public sealed class NetworkChangeNotifier : INetworkChangeNotifier
{
    private readonly ConcurrentDictionary<Guid, Channel<long>> _subscribers = new();

    public void Notify()
    {
        var tick = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        foreach (var channel in _subscribers.Values)
        {
            // Clients only need to know *that* something changed, so a dropped
            // duplicate tick costs nothing.
            channel.Writer.TryWrite(tick);
        }
    }

    public INetworkChangeSubscription Subscribe()
    {
        var id = Guid.NewGuid();
        var channel = Channel.CreateBounded<long>(
            new BoundedChannelOptions(1) { FullMode = BoundedChannelFullMode.DropOldest });

        _subscribers[id] = channel;
        return new Subscription(this, id, channel.Reader);
    }

    private void Unsubscribe(Guid id)
    {
        if (_subscribers.TryRemove(id, out var channel))
        {
            channel.Writer.TryComplete();
        }
    }

    private sealed class Subscription : INetworkChangeSubscription
    {
        private readonly NetworkChangeNotifier _owner;
        private readonly Guid _id;
        private bool _disposed;

        public Subscription(NetworkChangeNotifier owner, Guid id, ChannelReader<long> reader)
        {
            _owner = owner;
            _id = id;
            Reader = reader;
        }

        public ChannelReader<long> Reader { get; }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _owner.Unsubscribe(_id);
        }
    }
}
