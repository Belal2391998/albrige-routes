using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlbrigeTransport.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalizedNameColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DescriptionOrRouteRangeDe",
                table: "TransportLines",
                type: "TEXT",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionOrRouteRangeEn",
                table: "TransportLines",
                type: "TEXT",
                maxLength: 512,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LineNameDe",
                table: "TransportLines",
                type: "TEXT",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LineNameEn",
                table: "TransportLines",
                type: "TEXT",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DescriptionOrLandmarkDe",
                table: "Stations",
                type: "TEXT",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionOrLandmarkEn",
                table: "Stations",
                type: "TEXT",
                maxLength: 512,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StationNameDe",
                table: "Stations",
                type: "TEXT",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StationNameEn",
                table: "Stations",
                type: "TEXT",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Beside Abu Nseir Grand Mosque", null, "Abu Nseir Grand Mosque" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Princess Basma Roundabout", null, "Princess Basma Roundabout" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Opposite Al-Shaab nuts shop in Sweileh", null, "Sweileh (Al-Shaab Nuts Shop)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Near the electricity company in Sweileh", null, "Sweileh (Electricity Company)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Opposite Khalda commercial complex", null, "Khalda Roundabout" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Directly under the pedestrian bridge", null, "King Hussein Parks (pedestrian bridge)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "In front of the main shops at the roundabout", null, "Al-Shaab Roundabout" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "On the sidewalk opposite Zain at the pedestrian bridge", null, "Opposite Zain (pedestrian bridge)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Beside the Commercial Bank branch under the bridge", null, "Commercial Bank (pedestrian bridge)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Beside Manaseer station at the pedestrian bridge", null, "Manaseer Station (pedestrian bridge)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At the Consultations building at the University of Jordan", null, "Consultations Building" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Opposite Al-Isra Hospital", null, "Al-Isra Hospital" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Total station on University Street", null, "Total Station (University Street)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Under the pedestrian bridge opposite Ibn Al-Haytham Hospital", null, "Opposite Ibn Al-Haytham Hospital (pedestrian bridge)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Al-Waha Roundabout near Habibeh Sweets", null, "Al-Waha Roundabout (Habibeh)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Al-Kilo Roundabout under the pedestrian bridge", null, "Al-Kilo Roundabout (pedestrian bridge)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Safeway Roundabout on 7th Circle", null, "7th Circle (Safeway Roundabout)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Beside the Golf fuel station on 7th Circle", null, "Golf Station (7th Circle)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Beside Manaseer station at the pedestrian bridge", null, "Manaseer Station (pedestrian bridge)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "In front of Areefa Mall entrance in Tabarbour", null, "Areefa Mall" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Go fuel station before the North Complex", null, "Go Station (North Complex)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Sports City Roundabout after the service stop", null, "Sports City Roundabout (after the service)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Beside the Housing Bank complex", null, "Interior Ministry (Housing Bank Complex)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "On the sidewalk of 4th Circle", null, "4th Circle" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Near Abdoun Roundabout", null, "Abdoun Roundabout" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 26,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "In front of Taj Mall entrance", null, "Taj Mall" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 27,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Jo Petrol station on Abdoun Corridor", null, "Abdoun Corridor (Jopetrol Station)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 28,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Al-Bardini Roundabout in Marj Al-Hamam", null, "Marj Al-Hamam (Al-Bardini Roundabout)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 29,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At the church traffic lights in Marj Al-Hamam", null, "Marj Al-Hamam (Church traffic lights)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Shaab nuts shop on Al-Salam Road", null, "Al-Shaab Nuts Shop (Al-Salam Road)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 31,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Balqa Applied University triangle", null, "Al-Balqa University Triangle" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 32,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Wadi Hadi Bridge", null, "Wadi Hadi Bridge" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 33,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Near Al-Maghareeb Bridge", null, "Al-Maghareeb Bridge" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 34,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Al-Dabbas Bridge", null, "Al-Dabbas Bridge" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 35,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Sports City triangle", null, "Sports City Triangle" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 36,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "In front of Manaseer Complex", null, "Manaseer Complex" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 37,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At the Civil Defense traffic light", null, "Civil Defense Traffic Light" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 38,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Al-Dababneh Bridge", null, "Al-Dababneh Bridge" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 39,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Ain Al-Basha traffic light", null, "Ain Al-Basha Traffic Light" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 40,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Umm Al-Na'aj Roundabout", null, "Umm Al-Na'aj Roundabout" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 41,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "At Al-Kamaliya Roundabout", null, "Al-Kamaliya Roundabout" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 42,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Rajib — south of Sahab", null, "Al-Rajib (line start)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 43,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Rajib — Sahab", null, "Sahab Entrance Traffic Light" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 44,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Abu Alanda — Al-Quwaysimah", null, "Tilal Salwan Pharmacy (before Mercedes Bridge)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 45,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Abu Alanda — Al-Quwaysimah", null, "Islamic Bank (Abu Alanda Bridge)" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 46,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Muqabalain — Al-Hurriyah St.", null, "Customs Roundabout" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 47,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Muqabalain — Umm Qusayr", null, "Al-Huwayyan Roundabout" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 48,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Muqabalain — Al-Hurriyah St.", null, "Abu Zaghla Traffic Light" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 49,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Muqabalain — Al-Hurriyah St.", null, "Al-Huffaz Traffic Light" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 50,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Quwaysimah", null, "Al-Irsal Intersection" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 51,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Yasmeen — Al-Quwaysimah", null, "Hayy Al-Sahaba Traffic Light" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 52,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Quwaysimah", null, "Qarqash Roundabout" });

            migrationBuilder.UpdateData(
                table: "Stations",
                keyColumn: "Id",
                keyValue: 53,
                columns: new[] { "DescriptionOrLandmarkDe", "DescriptionOrLandmarkEn", "StationNameDe", "StationNameEn" },
                values: new object[] { null, "Al-Yasmeen area — Al-Quwaysimah", null, "Al-Yasmeen Roundabout" });

            migrationBuilder.UpdateData(
                table: "TransportLines",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DescriptionOrRouteRangeDe", "DescriptionOrRouteRangeEn", "LineNameDe", "LineNameEn" },
                values: new object[] { null, "From Abu Nseir Grand Mosque to Manaseer Station", null, "Abu Nseir Line" });

            migrationBuilder.UpdateData(
                table: "TransportLines",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DescriptionOrRouteRangeDe", "DescriptionOrRouteRangeEn", "LineNameDe", "LineNameEn" },
                values: new object[] { null, "From Consultations building to Manaseer Station", null, "Consultations Line" });

            migrationBuilder.UpdateData(
                table: "TransportLines",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DescriptionOrRouteRangeDe", "DescriptionOrRouteRangeEn", "LineNameDe", "LineNameEn" },
                values: new object[] { null, "From Areefa Mall to Al-Shaab Nuts Shop on Al-Salam Road", null, "Areefa Mall Line" });

            migrationBuilder.UpdateData(
                table: "TransportLines",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DescriptionOrRouteRangeDe", "DescriptionOrRouteRangeEn", "LineNameDe", "LineNameEn" },
                values: new object[] { null, "From Al-Balqa University triangle to Al-Kamaliya Roundabout", null, "Salt Line" });

            migrationBuilder.UpdateData(
                table: "TransportLines",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DescriptionOrRouteRangeDe", "DescriptionOrRouteRangeEn", "LineNameDe", "LineNameEn" },
                values: new object[] { null, "South Amman line — from Sahab entrance to Al-Yasmeen Roundabout", null, "Sahab Line" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescriptionOrRouteRangeDe",
                table: "TransportLines");

            migrationBuilder.DropColumn(
                name: "DescriptionOrRouteRangeEn",
                table: "TransportLines");

            migrationBuilder.DropColumn(
                name: "LineNameDe",
                table: "TransportLines");

            migrationBuilder.DropColumn(
                name: "LineNameEn",
                table: "TransportLines");

            migrationBuilder.DropColumn(
                name: "DescriptionOrLandmarkDe",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "DescriptionOrLandmarkEn",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "StationNameDe",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "StationNameEn",
                table: "Stations");
        }
    }
}
