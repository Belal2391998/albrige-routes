namespace AlbrigeTransport.Contracts;

public sealed class ApiResult<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public string? Error { get; init; }
    public DateTime TimestampUtc { get; init; } = DateTime.UtcNow;

    public static ApiResult<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResult<T> Fail(string error) =>
        new() { Success = false, Error = error };
}

public sealed class LocalizedTextDto
{
    public string Ar { get; set; } = string.Empty;
    public string En { get; set; } = string.Empty;
    public string? De { get; set; }
}
