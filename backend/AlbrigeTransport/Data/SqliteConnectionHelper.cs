namespace AlbrigeTransport.Data;

/// <summary>
/// Resolves SQLite connection strings to absolute paths and ensures the data directory exists.
/// </summary>
public static class SqliteConnectionHelper
{
    public static string ResolveAndPrepare(string connectionString, string contentRootPath)
    {
        var dataSource = ParseDataSource(connectionString);
        if (string.IsNullOrWhiteSpace(dataSource))
        {
            return connectionString;
        }

        var absolutePath = Path.IsPathRooted(dataSource)
            ? dataSource
            : Path.GetFullPath(Path.Combine(contentRootPath, dataSource));

        var directory = Path.GetDirectoryName(absolutePath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        return $"Data Source={absolutePath}";
    }

    private static string? ParseDataSource(string connectionString)
    {
        foreach (var part in connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (part.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase))
            {
                return part["Data Source=".Length..].Trim();
            }

            if (part.StartsWith("DataSource=", StringComparison.OrdinalIgnoreCase))
            {
                return part["DataSource=".Length..].Trim();
            }
        }

        return null;
    }
}
