using AlbrigeTransport.Models;
using Microsoft.EntityFrameworkCore;

namespace AlbrigeTransport.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<AdminPasscode> AdminPasscodes => Set<AdminPasscode>();
    public DbSet<AdminSecurity> AdminSecurities => Set<AdminSecurity>();
    public DbSet<TransportLine> TransportLines => Set<TransportLine>();
    public DbSet<Station> Stations => Set<Station>();
    public DbSet<UniversityDepartureTime> UniversityDepartureTimes => Set<UniversityDepartureTime>();
    public DbSet<LectureSchedule> LectureSchedules => Set<LectureSchedule>();
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AdminPasscode>(entity =>
        {
            entity.ToTable("AdminPasscodes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PasscodeHash).IsRequired().HasMaxLength(128);
        });

        modelBuilder.Entity<AdminSecurity>(entity =>
        {
            entity.ToTable("AdminSecurities");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(128);
        });

        modelBuilder.Entity<SiteSettings>(entity =>
        {
            entity.ToTable("SiteSettings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StatusBadgeText).IsRequired().HasMaxLength(64);
        });

        modelBuilder.Entity<TransportLine>(entity =>
        {
            entity.ToTable("TransportLines");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.LineNumber).IsUnique();
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.LineName).IsRequired().HasMaxLength(128);
            entity.Property(e => e.LineNameEn).IsRequired().HasMaxLength(128);
            entity.Property(e => e.LineNameDe).HasMaxLength(128);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(64);
            entity.Property(e => e.DescriptionOrRouteRange).IsRequired().HasMaxLength(512);
            entity.Property(e => e.DescriptionOrRouteRangeEn).IsRequired().HasMaxLength(512);
            entity.Property(e => e.DescriptionOrRouteRangeDe).HasMaxLength(512);
            entity.Property(e => e.UpdatedAt);

            entity.HasMany(e => e.Stations)
                .WithOne(e => e.Line)
                .HasForeignKey(e => e.TransportLineId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.UniversityDepartureTimes)
                .WithOne(e => e.Line)
                .HasForeignKey(e => e.TransportLineId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Station>(entity =>
        {
            entity.ToTable("Stations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TransportLineId, e.StationNumber }).IsUnique();
            entity.Property(e => e.StationName).IsRequired().HasMaxLength(256);
            entity.Property(e => e.StationNameEn).IsRequired().HasMaxLength(256);
            entity.Property(e => e.StationNameDe).HasMaxLength(256);
            entity.Property(e => e.DescriptionOrLandmark).IsRequired().HasMaxLength(512);
            entity.Property(e => e.DescriptionOrLandmarkEn).IsRequired().HasMaxLength(512);
            entity.Property(e => e.DescriptionOrLandmarkDe).HasMaxLength(512);
            entity.Property(e => e.DistanceText).IsRequired().HasMaxLength(64);
            entity.Property(e => e.ImagePath).IsRequired().HasMaxLength(512);
            entity.Property(e => e.GoogleMapsUrl).IsRequired().HasMaxLength(1024);
            entity.Property(e => e.TrafficStatus).IsRequired().HasMaxLength(32);
            entity.Property(e => e.DefaultGatheringTime).IsRequired().HasMaxLength(32);
            entity.Property(e => e.AdminNotes).IsRequired().HasMaxLength(1024);

            entity.HasMany(e => e.LectureSchedules)
                .WithOne(e => e.Station)
                .HasForeignKey(e => e.StationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UniversityDepartureTime>(entity =>
        {
            entity.ToTable("UniversityDepartureTimes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TimeString).IsRequired().HasMaxLength(32);
        });

        modelBuilder.Entity<LectureSchedule>(entity =>
        {
            entity.ToTable("LectureSchedules");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.StationId, e.LectureTime }).IsUnique();
            entity.Property(e => e.LectureTime).IsRequired().HasMaxLength(16);
            entity.Property(e => e.GatheringTime).IsRequired().HasMaxLength(32);
        });

        DbSeed.ApplySeedData(modelBuilder);
    }
}
