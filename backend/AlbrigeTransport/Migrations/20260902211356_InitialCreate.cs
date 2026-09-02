using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AlbrigeTransport.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminPasscodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PasscodeHash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminPasscodes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdminSecurities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminSecurities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SiteSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ShowScheduleTimes = table.Column<bool>(type: "INTEGER", nullable: false),
                    StatusBadgeText = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TransportLines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    LineNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    LineName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Slug = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    DescriptionOrRouteRange = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                    IsVisibleInPublicMenu = table.Column<bool>(type: "INTEGER", nullable: false),
                    GatheringPointsCount = table.Column<int>(type: "INTEGER", nullable: false),
                    EstimatedDurationMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransportLines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Stations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TransportLineId = table.Column<int>(type: "INTEGER", nullable: false),
                    StationNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    StationName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    DescriptionOrLandmark = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                    DistanceText = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    ImagePath = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                    Latitude = table.Column<double>(type: "REAL", nullable: false),
                    Longitude = table.Column<double>(type: "REAL", nullable: false),
                    GoogleMapsUrl = table.Column<string>(type: "TEXT", maxLength: 1024, nullable: false),
                    TrafficStatus = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    DefaultGatheringTime = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    AdminNotes = table.Column<string>(type: "TEXT", maxLength: 1024, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Stations_TransportLines_TransportLineId",
                        column: x => x.TransportLineId,
                        principalTable: "TransportLines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UniversityDepartureTimes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TransportLineId = table.Column<int>(type: "INTEGER", nullable: false),
                    TimeString = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UniversityDepartureTimes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UniversityDepartureTimes_TransportLines_TransportLineId",
                        column: x => x.TransportLineId,
                        principalTable: "TransportLines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LectureSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    StationId = table.Column<int>(type: "INTEGER", nullable: false),
                    LectureTime = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    GatheringTime = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LectureSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LectureSchedules_Stations_StationId",
                        column: x => x.StationId,
                        principalTable: "Stations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AdminPasscodes",
                columns: new[] { "Id", "PasscodeHash" },
                values: new object[] { 1, "13474678eaca9647778ea34ad98c59b6ef045cc1713e262902e3e35de455e4a9" });

            migrationBuilder.InsertData(
                table: "AdminSecurities",
                columns: new[] { "Id", "PasswordHash" },
                values: new object[] { 1, "13474678eaca9647778ea34ad98c59b6ef045cc1713e262902e3e35de455e4a9" });

            migrationBuilder.InsertData(
                table: "SiteSettings",
                columns: new[] { "Id", "ShowScheduleTimes", "StatusBadgeText", "UpdatedAt" },
                values: new object[] { 1, true, "سالك", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "TransportLines",
                columns: new[] { "Id", "DescriptionOrRouteRange", "EstimatedDurationMinutes", "GatheringPointsCount", "IsVisibleInPublicMenu", "LineName", "LineNumber", "Slug", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "من مسجد أبو نصير الكبير وحتى كازية المناصير", 55, 10, true, "خط أبو نصير", 1, "line-1", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "من الاستشارات وحتى كازية المناصير", 55, 9, true, "خط الاستشارات", 2, "line-2", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "من عريفة مول وحتى محمص الشعب على طريق السلام", 65, 11, true, "خط عريفة مول", 3, "line-3", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, "من مثلث جامعة البلقاء وحتى دوار الكمالية", 66, 11, true, "خط السلط", 4, "line-4", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 5, "خط جنوب عمّان — من مدخل سحاب حتى دوار الياسمين", 50, 12, true, "خط سحاب", 5, "line-5", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "Stations",
                columns: new[] { "Id", "AdminNotes", "DefaultGatheringTime", "DescriptionOrLandmark", "DistanceText", "GoogleMapsUrl", "ImagePath", "Latitude", "Longitude", "StationName", "StationNumber", "TrafficStatus", "TransportLineId" },
                values: new object[,]
                {
                    { 1, "", "06:50 AM", "بجانب مسجد أبو نصير الكبير", "", "https://maps.app.goo.gl/dj1oUNbuQnK7DPXY7?g_st=aw", "", 32.051836000000002, 35.881073999999998, "مسجد أبو نصير الكبير", 1, "سالك", 1 },
                    { 2, "", "06:55 AM", "عند دوار الأميرة بسمة", "", "https://www.google.com/maps?q=32.050787,35.884928", "", 32.050787, 35.884928000000002, "دوار الأميرة بسمة", 2, "سالك", 1 },
                    { 3, "", "07:05 AM", "مقابل محمص الشعب في صويلح", "", "https://www.google.com/maps?q=32.024634,35.853415", "", 32.024633999999999, 35.853414999999998, "صويلح (محمص الشعب)", 3, "سالك", 1 },
                    { 4, "", "07:10 AM", "قرب شركة الكهرباء في صويلح", "", "https://www.google.com/maps?q=31.95863,35.903898", "", 31.958629999999999, 35.903897999999998, "صويلح (شركة الكهرباء)", 4, "سالك", 1 },
                    { 5, "", "07:25 AM", "مقابل مجمع خلدا التجاري", "", "https://www.google.com/maps?q=31.993584,35.830104", "", 31.993583999999998, 35.830103999999999, "دوار خلدا", 5, "سالك", 1 },
                    { 6, "", "07:25 AM", "أسفل جسر المشاة مباشرة", "", "https://www.google.com/maps?q=31.989812,35.830166", "", 31.989812000000001, 35.830165999999998, "حدائق الحسين (جسر المشاة)", 6, "سالك", 1 },
                    { 7, "", "07:30 AM", "أمام محلات الدوار الرئيسية", "", "https://www.google.com/maps?q=31.971761,35.83968", "", 31.971761000000001, 35.839680000000001, "دوار الشعب", 7, "سالك", 1 },
                    { 8, "", "07:32 AM", "على الرصيف المقابل لمبنى زين عند جسر المشاة", "", "https://www.google.com/maps?q=31.966627,35.842381", "", 31.966626999999999, 35.842381000000003, "مقابل شركة زين (جسر المشاة)", 8, "سالك", 1 },
                    { 9, "", "07:35 AM", "بجانب فرع البنك التجاري تحت الجسر", "", "https://www.google.com/maps?q=31.953392,35.849005", "", 31.953392000000001, 35.849004999999998, "البنك التجاري (جسر المشاة)", 9, "سالك", 1 },
                    { 10, "", "07:40 AM", "بجانب محطة المناصير عند جسر المشاة", "", "https://www.google.com/maps?q=31.919624,35.859053", "", 31.919623999999999, 35.859053000000003, "كازية المناصير (جسر المشاة)", 10, "سالك", 1 },
                    { 11, "", "07:00 AM", "عند مبنى الاستشارات في الجامعة الأردنية", "", "https://www.google.com/maps?q=32.022712,35.873373", "", 32.022711999999999, 35.873373000000001, "الاستشارات", 1, "سالك", 2 },
                    { 12, "", "07:05 AM", "مقابل مستشفى الإسراء", "", "https://www.google.com/maps?q=32.01731,35.86593", "", 32.017310000000002, 35.865929999999999, "مستشفى الإسراء", 2, "سالك", 2 },
                    { 13, "", "07:10 AM", "كازية توتال على شارع الجامعة", "", "https://www.google.com/maps?q=32.005778,35.87265", "", 32.005777999999999, 35.87265, "كازية توتال (شارع الجامعة)", 3, "سالك", 2 },
                    { 14, "", "07:13 AM", "تحت جسر المشاة مقابل مستشفى ابن الهيثم", "", "https://www.google.com/maps?q=31.998518,35.872352", "", 31.998518000000001, 35.872351999999999, "مقابل مستشفى ابن الهيثم (جسر المشاة)", 4, "سالك", 2 },
                    { 15, "", "07:20 AM", "عند دوار الواحة قرب حلويات حبيبة", "", "https://www.google.com/maps?q=31.98867,35.866872", "", 31.988669999999999, 35.866872000000001, "دوار الواحة (حبيبة)", 5, "سالك", 2 },
                    { 16, "", "07:25 AM", "عند دوار الكيلو أسفل جسر المشاة", "", "https://www.google.com/maps?q=31.971271,35.86463", "", 31.971271000000002, 35.864629999999998, "دوار الكيلو (جسر المشاة)", 6, "سالك", 2 },
                    { 17, "", "07:35 AM", "عند دوار سيفوي في السابع", "", "https://www.google.com/maps?q=31.954169,35.857338", "", 31.954169, 35.857337999999999, "السابع (دوار السيفوي)", 7, "سالك", 2 },
                    { 18, "", "07:38 AM", "بجانب كازية جولف في السابع", "", "https://www.google.com/maps?q=31.942379,35.857223", "", 31.942378999999999, 35.857222999999998, "كازية جولف (السابع)", 8, "سالك", 2 },
                    { 19, "", "07:40 AM", "بجانب محطة المناصير عند جسر المشاة", "", "https://www.google.com/maps?q=31.919624,35.859053", "", 31.919623999999999, 35.859053000000003, "كازية المناصير (جسر المشاة)", 9, "سالك", 2 },
                    { 20, "", "06:55 AM", "أمام مدخل عريفة مول في طبربور", "", "https://www.google.com/maps?q=31.992506,35.934311", "", 31.992505999999999, 35.934311000000001, "عريفة مول", 1, "سالك", 3 },
                    { 21, "", "07:00 AM", "محطة Go قبل مجمع الشمال", "", "https://www.google.com/maps?q=31.993998,35.921451", "", 31.993998000000001, 35.921450999999998, "كازية Go (مجمع الشمال)", 2, "سالك", 3 },
                    { 22, "", "07:10 AM", "عند دوار المدينة الرياضية بعد السيرفيس", "", "https://www.google.com/maps?q=31.984842,35.89866", "", 31.984842, 35.89866, "دوار المدينة الرياضية (بعد السيرفيس)", 3, "سالك", 3 },
                    { 23, "", "07:15 AM", "بجانب مجمع بنك الإسكان", "", "https://www.google.com/maps?q=31.970882,35.907258", "", 31.970882, 35.907257999999999, "الداخلية (مجمع بنك الإسكان)", 4, "سالك", 3 },
                    { 24, "", "07:20 AM", "على رصيف الدوار الرابع", "", "https://www.google.com/maps?q=31.956087,35.895882", "", 31.956087, 35.895882, "الدوار الرابع", 5, "سالك", 3 },
                    { 25, "", "07:25 AM", "قرب دوار عبدون", "", "https://www.google.com/maps?q=31.948436,35.892195", "", 31.948436000000001, 35.892195000000001, "دوار عبدون", 6, "سالك", 3 },
                    { 26, "", "07:30 AM", "أمام مدخل تاج مول", "", "https://www.google.com/maps?q=31.941013,35.888717", "", 31.941013000000002, 35.888717, "تاج مول", 7, "سالك", 3 },
                    { 27, "", "07:35 AM", "محطة جو بترول على كوردور عبدون", "", "https://www.google.com/maps?q=31.92716,35.876121", "", 31.927160000000001, 35.876120999999998, "كوريدور عبدون (كازية جوبيترول)", 8, "سالك", 3 },
                    { 28, "", "07:45 AM", "عند دوار البرديني في مرج الحمام", "", "https://www.google.com/maps?q=31.902713,35.846609", "", 31.902712999999999, 35.846609000000001, "مرج الحمام (دوار البرديني)", 9, "سالك", 3 },
                    { 29, "", "07:50 AM", "عند إشارات الكنيسة في مرج الحمام", "", "https://www.google.com/maps?q=31.898829,35.858485", "", 31.898828999999999, 35.858485000000002, "مرج الحمام (إشارات الكنيسة)", 10, "سالك", 3 },
                    { 30, "", "07:55 AM", "محمص الشعب على طريق السلام", "", "https://www.google.com/maps?q=31.872623,35.83713", "", 31.872623000000001, 35.837130000000002, "محمص الشعب (طريق السلام)", 11, "سالك", 3 },
                    { 31, "", "06:30 AM", "مثلث جامعة البلقاء التطبيقية", "", "https://maps.app.goo.gl/7YNEies2FAHa2LpK8?g_st=aw", "", 32.021844999999999, 35.713487000000001, "مثلث جامعة البلقاء", 1, "سالك", 4 },
                    { 32, "", "06:30 AM", "عند جسر وادي حادي", "", "https://maps.app.goo.gl/2ACujcmjCPZE4Zgn8?g_st=aw", "", 32.031329999999997, 35.713769999999997, "جسر وادي حادي", 2, "سالك", 4 },
                    { 33, "", "06:35 AM", "قرب جسر المغاريب", "", "https://maps.app.goo.gl/jMs2kNvwyAzbUuiE7?g_st=aw", "", 32.035232999999998, 35.702998000000001, "جسر المغاريب", 3, "سالك", 4 },
                    { 34, "", "06:35 AM", "عند جسر الدباس", "", "https://maps.app.goo.gl/HEjV7NFpSvUsDRjY6?g_st=aw", "", 32.051000000000002, 35.701300000000003, "جسر الدباس", 4, "سالك", 4 },
                    { 35, "", "06:40 AM", "عند مثلث المدينة الرياضية", "", "https://maps.app.goo.gl/iHNsYTDDnpuc6jL47?g_st=aw", "", 32.060516, 35.701256000000001, "مثلث المدينة الرياضية", 5, "سالك", 4 },
                    { 36, "", "06:45 AM", "أمام مجمع المناصير", "", "https://maps.app.goo.gl/KJ9by3ZuxU3PcSCr7?g_st=aw", "", 32.065561000000002, 35.724066999999998, "مجمع المناصير", 6, "سالك", 4 },
                    { 37, "", "06:45 AM", "عند إشارة الدفاع المدني", "", "https://maps.app.goo.gl/E6AS1PCsQZPzVtfaA?g_st=aw", "", 32.063352999999999, 35.737842999999998, "إشارة الدفاع المدني", 7, "سالك", 4 },
                    { 38, "", "06:50 AM", "عند جسر الدبابنة", "", "https://maps.app.goo.gl/vRPmrruaTCuc5cxn8?g_st=aw", "", 32.057433000000003, 35.747394, "جسر الدبابنة", 8, "سالك", 4 },
                    { 39, "", "06:55 AM", "على إشارة عين الباشا", "", "https://maps.app.goo.gl/VNANJgRjRRocnGL37?g_st=aw", "", 32.040517000000001, 35.786078000000003, "إشارة عين الباشا", 9, "سالك", 4 },
                    { 40, "", "07:00 AM", "عند دوار أم النعاج", "", "https://maps.app.goo.gl/foga5s7ALZij5eqh6?g_st=aw", "", 32.027538, 35.798774999999999, "دوار أم النعاج", 10, "سالك", 4 },
                    { 41, "", "07:00 AM", "عند دوار الكمالية", "", "https://maps.app.goo.gl/SoVksVXvTcgozzkQA?g_st=aw", "", 32.028785999999997, 35.825091, "دوار الكمالية", 11, "سالك", 4 },
                    { 42, "", "07:40 AM", "الرجيب — جنوب سحاب", "", "https://maps.app.goo.gl/mBMLHg6oMoFqjMvk8", "", 31.882114999999999, 35.992024000000001, "الرجيب (بداية الخط)", 1, "سالك", 5 },
                    { 43, "", "07:45 AM", "الرجيب — سحاب", "", "https://maps.app.goo.gl/ZNgp5S4AZGYYbXx18", "", 31.892364000000001, 35.979774999999997, "إشارة مدخل سحاب", 2, "سالك", 5 },
                    { 44, "", "06:50 AM", "أبو علندا — القويسمة", "", "https://maps.app.goo.gl/Pw5m7LqbHfhDP8bZ9", "", 31.899619000000001, 35.960177000000002, "صيدلية تلال سلوان (قبل جسر مرسيدس)", 3, "سالك", 5 },
                    { 45, "", "06:55 AM", "أبو علندا — القويسمة", "", "https://maps.app.goo.gl/bCCi7pw4n4tVbN839", "", 31.901107, 35.937694999999998, "البنك الإسلامي (جسر أبو علندا)", 4, "سالك", 5 },
                    { 46, "", "07:00 AM", "المقابلين — شارع الحرية", "", "https://maps.app.goo.gl/A1tc2aLaPp5E1Wez8", "", 31.900479000000001, 35.931444999999997, "دوار الجمرك", 5, "سالك", 5 },
                    { 47, "", "07:55 AM", "المقابلين — أم قصير", "", "https://maps.app.goo.gl/67DCNjF37Hp1YBii8", "", 31.895980000000002, 35.912909999999997, "دوار الحويان", 6, "سالك", 5 },
                    { 48, "", "07:05 AM", "المقابلين — شارع الحرية", "", "https://maps.app.goo.gl/3d8v7UYaCND4dB1n7", "", 31.896501000000001, 35.903098, "إشارة أبو زغلة", 7, "سالك", 5 },
                    { 49, "", "07:10 AM", "المقابلين — شارع الحرية", "", "https://maps.app.goo.gl/XTmm9u83w197ropH6", "", 31.902439000000001, 35.890802000000001, "إشارة الحفاظ", 8, "سالك", 5 },
                    { 50, "", "07:15 AM", "القويسمة", "", "https://maps.app.goo.gl/Tg1BUt8cTXpiAsCz5", "", 31.911683, 35.881439999999998, "تقاطع الإرسال", 9, "سالك", 5 },
                    { 51, "", "07:20 AM", "الياسمين — القويسمة", "", "https://maps.app.goo.gl/2a7K35KiW4CM8caBA", "", 31.914325999999999, 35.887165000000003, "إشارة حي الصحابة", 10, "سالك", 5 },
                    { 52, "", "07:25 AM", "القويسمة", "", "https://maps.app.goo.gl/jk6y5KDxbtRLY59x5", "", 31.920332999999999, 35.894745999999998, "دوار قرقش", 11, "سالك", 5 },
                    { 53, "", "07:30 AM", "منطقة الياسمين — القويسمة", "", "https://www.google.com/maps?q=31.9168,35.8892", "", 31.916799999999999, 35.889200000000002, "دوار الياسمين", 12, "سالك", 5 }
                });

            migrationBuilder.InsertData(
                table: "UniversityDepartureTimes",
                columns: new[] { "Id", "TimeString", "TransportLineId" },
                values: new object[,]
                {
                    { 1, "11:40 AM", 1 },
                    { 2, "01:10 PM", 1 },
                    { 3, "02:40 PM", 1 },
                    { 4, "04:40 PM", 1 },
                    { 5, "11:40 AM", 2 },
                    { 6, "01:10 PM", 2 },
                    { 7, "02:40 PM", 2 },
                    { 8, "04:40 PM", 2 },
                    { 9, "11:40 AM", 3 },
                    { 10, "01:10 PM", 3 },
                    { 11, "02:40 PM", 3 },
                    { 12, "04:40 PM", 3 },
                    { 13, "02:40 PM", 4 },
                    { 14, "04:40 PM", 5 }
                });

            migrationBuilder.InsertData(
                table: "LectureSchedules",
                columns: new[] { "Id", "GatheringTime", "LectureTime", "StationId" },
                values: new object[,]
                {
                    { 1, "06:50 AM", "8:30", 1 },
                    { 2, "08:00 AM", "10:00", 1 },
                    { 3, "09:45 AM", "11:30", 1 },
                    { 4, "06:55 AM", "8:30", 2 },
                    { 5, "08:05 AM", "10:00", 2 },
                    { 6, "09:50 AM", "11:30", 2 },
                    { 7, "07:05 AM", "8:30", 3 },
                    { 8, "08:15 AM", "10:00", 3 },
                    { 9, "10:00 AM", "11:30", 3 },
                    { 10, "07:10 AM", "8:30", 4 },
                    { 11, "08:25 AM", "10:00", 4 },
                    { 12, "10:05 AM", "11:30", 4 },
                    { 13, "07:25 AM", "8:30", 5 },
                    { 14, "08:45 AM", "10:00", 5 },
                    { 15, "10:15 AM", "11:30", 5 },
                    { 16, "07:25 AM", "8:30", 6 },
                    { 17, "08:45 AM", "10:00", 6 },
                    { 18, "10:15 AM", "11:30", 6 },
                    { 19, "07:30 AM", "8:30", 7 },
                    { 20, "08:55 AM", "10:00", 7 },
                    { 21, "10:20 AM", "11:30", 7 },
                    { 22, "07:32 AM", "8:30", 8 },
                    { 23, "08:57 AM", "10:00", 8 },
                    { 24, "10:22 AM", "11:30", 8 },
                    { 25, "07:35 AM", "8:30", 9 },
                    { 26, "09:00 AM", "10:00", 9 },
                    { 27, "10:25 AM", "11:30", 9 },
                    { 28, "07:40 AM", "8:30", 10 },
                    { 29, "09:10 AM", "10:00", 10 },
                    { 30, "10:30 AM", "11:30", 10 },
                    { 31, "07:00 AM", "8:30", 11 },
                    { 32, "08:20 AM", "10:00", 11 },
                    { 33, "09:45 AM", "11:30", 11 },
                    { 34, "07:05 AM", "8:30", 12 },
                    { 35, "08:25 AM", "10:00", 12 },
                    { 36, "09:55 AM", "11:30", 12 },
                    { 37, "07:10 AM", "8:30", 13 },
                    { 38, "08:30 AM", "10:00", 13 },
                    { 39, "10:00 AM", "11:30", 13 },
                    { 40, "07:13 AM", "8:30", 14 },
                    { 41, "08:35 AM", "10:00", 14 },
                    { 42, "10:03 AM", "11:30", 14 },
                    { 43, "07:20 AM", "8:30", 15 },
                    { 44, "08:50 AM", "10:00", 15 },
                    { 45, "10:10 AM", "11:30", 15 },
                    { 46, "07:25 AM", "8:30", 16 },
                    { 47, "08:55 AM", "10:00", 16 },
                    { 48, "10:15 AM", "11:30", 16 },
                    { 49, "07:35 AM", "8:30", 17 },
                    { 50, "09:05 AM", "10:00", 17 },
                    { 51, "10:25 AM", "11:30", 17 },
                    { 52, "07:38 AM", "8:30", 18 },
                    { 53, "09:08 AM", "10:00", 18 },
                    { 54, "10:28 AM", "11:30", 18 },
                    { 55, "07:40 AM", "8:30", 19 },
                    { 56, "09:10 AM", "10:00", 19 },
                    { 57, "10:30 AM", "11:30", 19 },
                    { 58, "06:55 AM", "8:30", 20 },
                    { 59, "08:15 AM", "10:00", 20 },
                    { 60, "09:45 AM", "11:30", 20 },
                    { 61, "07:00 AM", "8:30", 21 },
                    { 62, "08:20 AM", "10:00", 21 },
                    { 63, "09:50 AM", "11:30", 21 },
                    { 64, "07:10 AM", "8:30", 22 },
                    { 65, "08:35 AM", "10:00", 22 },
                    { 66, "10:05 AM", "11:30", 22 },
                    { 67, "07:15 AM", "8:30", 23 },
                    { 68, "08:45 AM", "10:00", 23 },
                    { 69, "10:15 AM", "11:30", 23 },
                    { 70, "07:20 AM", "8:30", 24 },
                    { 71, "08:50 AM", "10:00", 24 },
                    { 72, "10:20 AM", "11:30", 24 },
                    { 73, "07:25 AM", "8:30", 25 },
                    { 74, "08:55 AM", "10:00", 25 },
                    { 75, "10:20 AM", "11:30", 25 },
                    { 76, "07:30 AM", "8:30", 26 },
                    { 77, "09:00 AM", "10:00", 26 },
                    { 78, "10:25 AM", "11:30", 26 },
                    { 79, "07:35 AM", "8:30", 27 },
                    { 80, "09:05 AM", "10:00", 27 },
                    { 81, "10:30 AM", "11:30", 27 },
                    { 82, "07:45 AM", "8:30", 28 },
                    { 83, "09:15 AM", "10:00", 28 },
                    { 84, "10:40 AM", "11:30", 28 },
                    { 85, "07:50 AM", "8:30", 29 },
                    { 86, "09:20 AM", "10:00", 29 },
                    { 87, "10:45 AM", "11:30", 29 },
                    { 88, "07:55 AM", "8:30", 30 },
                    { 89, "09:25 AM", "10:00", 30 },
                    { 90, "10:50 AM", "11:30", 30 },
                    { 91, "06:30 AM", "8:30", 31 },
                    { 92, "07:45 AM", "10:00", 31 },
                    { 93, "06:30 AM", "8:30", 32 },
                    { 94, "07:50 AM", "10:00", 32 },
                    { 95, "06:35 AM", "8:30", 33 },
                    { 96, "07:50 AM", "10:00", 33 },
                    { 97, "06:35 AM", "8:30", 34 },
                    { 98, "07:50 AM", "10:00", 34 },
                    { 99, "06:40 AM", "8:30", 35 },
                    { 100, "07:55 AM", "10:00", 35 },
                    { 101, "06:45 AM", "8:30", 36 },
                    { 102, "08:00 AM", "10:00", 36 },
                    { 103, "06:45 AM", "8:30", 37 },
                    { 104, "08:00 AM", "10:00", 37 },
                    { 105, "06:50 AM", "8:30", 38 },
                    { 106, "08:10 AM", "10:00", 38 },
                    { 107, "06:55 AM", "8:30", 39 },
                    { 108, "08:15 AM", "10:00", 39 },
                    { 109, "07:00 AM", "8:30", 40 },
                    { 110, "08:20 AM", "10:00", 40 },
                    { 111, "07:00 AM", "8:30", 41 },
                    { 112, "08:25 AM", "10:00", 41 },
                    { 113, "07:40 AM", "8:30", 42 },
                    { 114, "07:45 AM", "8:30", 43 },
                    { 115, "06:50 AM", "8:30", 44 },
                    { 116, "06:55 AM", "8:30", 45 },
                    { 117, "07:00 AM", "8:30", 46 },
                    { 118, "07:55 AM", "8:30", 47 },
                    { 119, "07:05 AM", "8:30", 48 },
                    { 120, "07:10 AM", "8:30", 49 },
                    { 121, "07:15 AM", "8:30", 50 },
                    { 122, "07:20 AM", "8:30", 51 },
                    { 123, "07:25 AM", "8:30", 52 },
                    { 124, "07:30 AM", "8:30", 53 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_LectureSchedules_StationId_LectureTime",
                table: "LectureSchedules",
                columns: new[] { "StationId", "LectureTime" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stations_TransportLineId_StationNumber",
                table: "Stations",
                columns: new[] { "TransportLineId", "StationNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TransportLines_LineNumber",
                table: "TransportLines",
                column: "LineNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TransportLines_Slug",
                table: "TransportLines",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UniversityDepartureTimes_TransportLineId",
                table: "UniversityDepartureTimes",
                column: "TransportLineId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminPasscodes");

            migrationBuilder.DropTable(
                name: "AdminSecurities");

            migrationBuilder.DropTable(
                name: "LectureSchedules");

            migrationBuilder.DropTable(
                name: "SiteSettings");

            migrationBuilder.DropTable(
                name: "UniversityDepartureTimes");

            migrationBuilder.DropTable(
                name: "Stations");

            migrationBuilder.DropTable(
                name: "TransportLines");
        }
    }
}
