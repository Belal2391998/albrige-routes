namespace AlbrigeTransport.Services;

public interface ILocaleService
{
    string GetRequestedCulture(HttpContext httpContext);
    string T(string key, string culture);
}

public sealed class LocaleService : ILocaleService
{
    private static readonly string[] Supported = ["ar", "en", "de"];

    private static readonly Dictionary<string, Dictionary<string, string>> Messages = new()
    {
        ["ar"] = new(StringComparer.Ordinal)
        {
            ["sync_live"] = "متزامن مع الخوادم اللحظية",
            ["sync_local"] = "تخزين محلي — بانتظار ربط الخادم",
            ["passcode_prompt"] = "أدخل رمز الدخول للمتابعة",
            ["passcode_invalid"] = "رمز الدخول غير صحيح",
            ["password_changed"] = "تم تحديث كلمة السر",
            ["password_invalid"] = "كلمة السر الحالية غير صحيحة",
            ["password_mismatch"] = "تأكيد كلمة السر غير متطابق",
            ["password_weak"] = "كلمة السر قصيرة جداً",
            ["unauthorized"] = "يجب تسجيل الدخول للمتابعة",
            ["show_schedule_times"] = "إظهار أوقات الدوام",
            ["saved"] = "تم الحفظ",
            ["restored"] = "تمت الاستعادة",
        },
        ["en"] = new(StringComparer.Ordinal)
        {
            ["sync_live"] = "Synced with live servers",
            ["sync_local"] = "Local storage — awaiting server connection",
            ["passcode_prompt"] = "Enter access code to continue",
            ["passcode_invalid"] = "Invalid access code",
            ["password_changed"] = "Password updated",
            ["password_invalid"] = "Current password is incorrect",
            ["password_mismatch"] = "Password confirmation does not match",
            ["password_weak"] = "Password is too short",
            ["unauthorized"] = "Authentication required",
            ["show_schedule_times"] = "Show office hours",
            ["saved"] = "Saved",
            ["restored"] = "Restored",
        },
        ["de"] = new(StringComparer.Ordinal)
        {
            ["sync_live"] = "Mit Live-Servern synchronisiert",
            ["sync_local"] = "Lokaler Speicher — Serververbindung ausstehend",
            ["passcode_prompt"] = "Zugangscode eingeben",
            ["passcode_invalid"] = "Ungültiger Zugangscode",
            ["password_changed"] = "Passwort aktualisiert",
            ["password_invalid"] = "Aktuelles Passwort ist falsch",
            ["password_mismatch"] = "Passwortbestätigung stimmt nicht überein",
            ["password_weak"] = "Passwort ist zu kurz",
            ["unauthorized"] = "Anmeldung erforderlich",
            ["show_schedule_times"] = "Dienstzeiten anzeigen",
            ["saved"] = "Gespeichert",
            ["restored"] = "Wiederhergestellt",
        },
    };

    public string GetRequestedCulture(HttpContext httpContext)
    {
        var header = httpContext.Request.Headers.AcceptLanguage.ToString();
        if (string.IsNullOrWhiteSpace(header))
        {
            return "ar";
        }

        var first = header.Split(',')[0]?.Trim().Split('-')[0]?.ToLowerInvariant();
        return Supported.Contains(first) ? first! : "ar";
    }

    public string T(string key, string culture)
    {
        if (Messages.TryGetValue(culture, out var map) && map.TryGetValue(key, out var value))
        {
            return value;
        }

        return Messages["en"].TryGetValue(key, out var fallback) ? fallback : key;
    }
}
