namespace AlbrigeTransport.Contracts.Stations;

using System.ComponentModel.DataAnnotations;
using AlbrigeTransport.Services;

/// <summary>
/// Rejects unrecognised traffic values instead of letting the mapper fall back to
/// "سالك", which would silently mark a congested station as clear.
/// </summary>
public sealed class TrafficStatusCodeAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is null)
        {
            return true;
        }

        if (value is not string code)
        {
            return false;
        }

        return TrafficStatusMapper.IsAccepted(code);
    }

    public override string FormatErrorMessage(string name)
        => $"'{name}' must be one of: {string.Join(", ", TrafficStatusMapper.AcceptedCodes)}.";
}
