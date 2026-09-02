using AlbrigeTransport.Data;
using AlbrigeTransport.Filters;
using AlbrigeTransport.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddControllers(options =>
    {
        options.Filters.Add<NotifyNetworkChangeFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = builder.Environment.IsDevelopment();
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
            ?? ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"];

        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=Data/albrige_transport.db";

connectionString = SqliteConnectionHelper.ResolveAndPrepare(
    connectionString,
    builder.Environment.ContentRootPath);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        connectionString,
        sqlite => sqlite.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

builder.Services.AddSingleton<IAdminSessionService, AdminSessionService>();
builder.Services.AddSingleton<INetworkChangeNotifier, NetworkChangeNotifier>();
builder.Services.AddScoped<ILocaleService, LocaleService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ITransportLineService, TransportLineService>();
builder.Services.AddScoped<IStationService, StationService>();
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<INetworkSyncService, NetworkSyncService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeed.EnsureSeededAsync(db);
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseRouting();
app.UseCors("Frontend");
app.UseAuthorization();

app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
