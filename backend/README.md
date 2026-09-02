# Albrige Transport — ASP.NET Core MVC Backend

Local database: **SQLite** (`Data/albrige_transport.db`).

## Database — SQLite schema

### Tables

| Table | Purpose |
|-------|---------|
| `AdminPasscodes` | PIN hash for dashboard unlock (`Id`, `PasscodeHash`) |
| `AdminSecurities` | Admin password hash (`Id`, `PasswordHash`) |
| `TransportLines` | 5 main lines — أبو نصير, الاستشارات, عريفة مول, السلط, سحاب |
| `Stations` | 53 gathering points with GPS, Google Maps URL, traffic status |
| `UniversityDepartureTimes` | Return departures from campus per line |
| `LectureSchedules` | Lecture → gathering time per station |
| `SiteSettings` | Public display flags (`ShowScheduleTimes`, etc.) |

### Relationships

```
TransportLine (1) ──< Station (many)          ON DELETE CASCADE
TransportLine (1) ──< UniversityDepartureTime ON DELETE CASCADE
Station (1)       ──< LectureSchedule        ON DELETE CASCADE
```

### Seed data (53 stations)

| Line | Name | Stations |
|------|------|----------|
| 1 | خط أبو نصير | 10 |
| 2 | خط الاستشارات | 9 |
| 3 | خط عريفة مول | 11 |
| 4 | خط السلط | 11 |
| 5 | خط سحاب | 12 |

Default PIN: `1234` (SHA-256 of `albridge-admin:1234`).

Seed source: `Data/TransportNetworkSeedData.cs` (mirrors frontend `transportData.ts`).

---

## Run (SQLite)

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- EF Core CLI: `dotnet tool install --global dotnet-ef`

### Commands

The `InitialCreate` migration is already committed, so a fresh clone only needs
steps 1, 2 and 4.

```powershell
cd backend/AlbrigeTransport

# 1. Restore packages (Sqlite provider)
dotnet restore

# 2. Apply migrations → creates the .db file + seed rows
dotnet ef database update

# 3. Only if you change the entity models
dotnet ef migrations add <YourMigrationName>

# 4. Run API on http://localhost:5000
dotnet run --urls "http://localhost:5000"
```

**Development** uses `Data/albrige_transport.dev.db` (see `appsettings.Development.json`).

### Running both servers

Use two terminals — the backend must be running for the dashboard to persist changes:

```powershell
# Terminal 1 — API
cd backend/AlbrigeTransport ; dotnet run --urls "http://localhost:5000"

# Terminal 2 — frontend on http://localhost:8080
npm run dev
```

`http://localhost:8080` is registered in `Cors:Origins`; add any new frontend
origin there or the browser will block the requests.

HTTPS on `https://localhost:5001` also works after a one-time
`dotnet dev-certs https --trust`. `UseHttpsRedirection` is disabled in
Development so plain HTTP works without certificate setup.

On startup, `DbSeed.EnsureSeededAsync` also applies pending migrations and falls back to runtime seed if the DB is empty.

### Connection string

`appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Data Source=Data/albrige_transport.db"
}
```

`Program.cs` resolves this to an absolute path and creates the `Data/` folder automatically.

---

## REST API

### Auth (`/api/auth`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/passcode/verify` | Public | PIN verification |
| GET | `/api/auth/session` | Public | Session status |
| POST | `/api/auth/password/change` | Admin | Change password |
| POST | `/api/auth/logout` | Admin | Revoke session |

**Admin header:** `X-Admin-Session: {token}`

### Dashboard (`/api/dashboard`)
| GET | `/api/dashboard/overview` | Admin | Lines/stops counters + sync status |

### Transport Lines (`/api/transport-lines`)
| GET | `/public` | Public | Visible lines |
| GET | `/` | Admin | All lines |
| POST | `/` | Admin | Create |
| PUT | `/{id}` | Admin | Update |
| DELETE | `/{id}` | Admin | Delete |
| PATCH | `/{id}/visibility` | Admin | Toggle public visibility |
| PUT | `/batch` | Admin | Batch save |

### Stations (`/api/stations`)
| PUT | `/{id}` | Admin | Update station |
| PUT | `/batch/{lineId}` | Admin | حفظ كل المحطات |
| POST | `/{id}/image` | Admin | Upload image |
| POST | `/restore-defaults` | Admin | استعادة كل الجداول |

### Settings (`/api/settings`)
| GET | `/` | Public | Site settings |
| PUT | `/` | Admin | Toggle إظهار أوقات الدوام |

### Network (`/api/network`)
| GET | `/snapshot` | Public | Public network snapshot |
| GET | `/snapshot/admin` | Admin | Full admin snapshot |
| PUT | `/sync` | Admin | Two-way sync |

---

## Frontend

Set in project root `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Without this variable the frontend falls back to local browser storage and admin
edits never reach SQLite.

## Traffic status codes

Any other value is rejected with `400` by `TrafficStatusCodeAttribute` so a typo
cannot silently mark a congested station as clear.

| Code | Arabic |
|------|--------|
| `clear` | سالك |
| `moderate` | بطيء |
| `congested` | مزدحم |
