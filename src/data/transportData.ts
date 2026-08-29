import heroFleet from "@/assets/hero-fleet.jpg";
import heroFleetGallery from "@/assets/hero-fleet-gallery.jpg";
import heroFleetVideo from "@/assets/hero-fleet.mp4";
import fleetRoad from "@/assets/fleet-road.jpg";
import fleetRoadGallery from "@/assets/fleet-road-gallery.jpg";
import fleetBoarding from "@/assets/fleet-boarding.jpg";
import fleetBoardingGallery from "@/assets/fleet-boarding-gallery.jpg";
import fleetInterior from "@/assets/fleet-interior.jpg";
import fleetInteriorGallery from "@/assets/fleet-interior-gallery.jpg";
import fleetBus2908 from "@/assets/fleet-bus-2908.jpg";
import fleetBus3386 from "@/assets/fleet-bus-3386.jpg";
import fleetBus3954 from "@/assets/fleet-bus-3954.jpg";
import fleetBus4378 from "@/assets/fleet-bus-4378.jpg";
import fleetBus4594 from "@/assets/fleet-bus-4594.jpg";
import fleetBus4735 from "@/assets/fleet-bus-4735.jpg";
import fleetBus4848 from "@/assets/fleet-bus-4848.jpg";
import fleetBus9945 from "@/assets/fleet-bus-9945.jpg";
import type { Localized } from "@/lib/i18n";
import {
  getReturnDepartures,
  lectureScheduleNote,
  lectureSchedulesByLineId,
  toDisplayTime,
} from "@/data/lineLectureSchedules";

export type TrafficStatus = "clear" | "moderate" | "congested";

export interface Stop {
  id: string;
  name: Localized;
  lineId: number;
  order: number;
  lat: number;
  lng: number;
  imageUrl: string;
  landmarkDescription: Localized;
  googleMapsUrl: string;
  departureTime: string;
  trafficStatus?: TrafficStatus;
  adminNote?: string;
}

export interface Line {
  id: number;
  slug: string;
  title: Localized;
  subtitle: Localized;
  badge: Localized;
  color: string;
  stops: Stop[];
  /** Afternoon return departures from campus (display-ready) */
  returnDepartures?: string[];
}

const stopImages = [fleetBoarding, fleetRoad, heroFleet, fleetInterior];

const mapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps?q=${lat},${lng}`;

type RawStop = [
  nameAr: string,
  nameEn: string,
  lat: number,
  lng: number,
  landmarkAr: string,
  landmarkEn: string,
  departureTime: string,
  mapsUrlOverride?: string,
];

function buildStops(lineId: number, raw: RawStop[]): Stop[] {
  const schedules = lectureSchedulesByLineId[lineId];
  return raw.map(([nameAr, nameEn, lat, lng, landmarkAr, landmarkEn, departureTime, mapsUrlOverride], i) => {
    const lectureTimes = schedules?.[i];
    return {
      id: `line-${lineId}-stop-${i + 1}`,
      name: { ar: nameAr, en: nameEn },
      lineId,
      order: i + 1,
      lat,
      lng,
      imageUrl: stopImages[(lineId + i) % stopImages.length] ?? stopImages[0]!,
      landmarkDescription: { ar: landmarkAr, en: landmarkEn },
      googleMapsUrl: mapsUrlOverride ?? mapsUrl(lat, lng),
      departureTime: lectureTimes ? toDisplayTime(lectureTimes[0]) : departureTime,
      ...(lectureTimes ? { adminNote: lectureScheduleNote(lectureTimes) } : {}),
    };
  });
}

export const lines: Line[] = [
  {
    id: 1,
    slug: "line-1",
    title: { ar: "خط أبو نصير", en: "Abu Nseir Line" },
    subtitle: { ar: "من مسجد أبو نصير الكبير وحتى كازية المناصير", en: "From Abu Nseir Grand Mosque to Manaseer Station" },
    badge: { ar: "الخط الأول", en: "Line 1" },
    color: "#0B2265",
    stops: buildStops(1, [
      [
        "مسجد أبو نصير الكبير",
        "Abu Nseir Grand Mosque",
        32.051836,
        35.881074,
        "بجانب مسجد أبو نصير الكبير",
        "Beside Abu Nseir Grand Mosque",
        "07:00 AM",
        "https://maps.app.goo.gl/dj1oUNbuQnK7DPXY7?g_st=aw",
      ],
      [
        "دوار الأميرة بسمة",
        "Princess Basma Roundabout",
        32.050787,
        35.884928,
        "عند دوار الأميرة بسمة",
        "At Princess Basma Roundabout",
        "07:05 AM",
      ],
      [
        "صويلح (محمص الشعب)",
        "Sweileh (Al-Shaab Nuts Shop)",
        32.024634,
        35.853415,
        "مقابل محمص الشعب في صويلح",
        "Opposite Al-Shaab nuts shop in Sweileh",
        "07:12 AM",
      ],
      [
        "صويلح (شركة الكهرباء)",
        "Sweileh (Electricity Company)",
        31.95863,
        35.903898,
        "قرب شركة الكهرباء في صويلح",
        "Near the electricity company in Sweileh",
        "07:16 AM",
      ],
      [
        "دوار خلدا",
        "Khalda Roundabout",
        31.993584,
        35.830104,
        "مقابل مجمع خلدا التجاري",
        "Opposite Khalda commercial complex",
        "07:22 AM",
      ],
      [
        "حدائق الحسين (جسر المشاة)",
        "King Hussein Parks (pedestrian bridge)",
        31.989812,
        35.830166,
        "أسفل جسر المشاة مباشرة",
        "Directly under the pedestrian bridge",
        "07:28 AM",
      ],
      [
        "دوار الشعب",
        "Al-Shaab Roundabout",
        31.971761,
        35.83968,
        "أمام محلات الدوار الرئيسية",
        "In front of the main shops at the roundabout",
        "07:34 AM",
      ],
      [
        "مقابل شركة زين (جسر المشاة)",
        "Opposite Zain (pedestrian bridge)",
        31.966627,
        35.842381,
        "على الرصيف المقابل لمبنى زين عند جسر المشاة",
        "On the sidewalk opposite Zain at the pedestrian bridge",
        "07:40 AM",
      ],
      [
        "البنك التجاري (جسر المشاة)",
        "Commercial Bank (pedestrian bridge)",
        31.953392,
        35.849005,
        "بجانب فرع البنك التجاري تحت الجسر",
        "Beside the Commercial Bank branch under the bridge",
        "07:45 AM",
      ],
      [
        "كازية المناصير (جسر المشاة)",
        "Manaseer Station (pedestrian bridge)",
        31.919624,
        35.859053,
        "بجانب محطة المناصير عند جسر المشاة",
        "Beside Manaseer station at the pedestrian bridge",
        "07:55 AM",
      ],
    ]),
  },
  {
    id: 2,
    slug: "line-2",
    title: { ar: "خط الاستشارات", en: "Consultations Line" },
    subtitle: { ar: "من الاستشارات وحتى كازية المناصير", en: "From Consultations building to Manaseer Station" },
    badge: { ar: "الخط الثاني", en: "Line 2" },
    color: "#E5A93C",
    stops: buildStops(2, [
      [
        "الاستشارات",
        "Consultations Building",
        32.022712,
        35.873373,
        "عند مبنى الاستشارات في الجامعة الأردنية",
        "At the Consultations building at the University of Jordan",
        "07:00 AM",
      ],
      [
        "مستشفى الإسراء",
        "Al-Isra Hospital",
        32.01731,
        35.86593,
        "مقابل مستشفى الإسراء",
        "Opposite Al-Isra Hospital",
        "07:05 AM",
      ],
      [
        "كازية توتال (شارع الجامعة)",
        "Total Station (University Street)",
        32.005778,
        35.87265,
        "كازية توتال على شارع الجامعة",
        "Total station on University Street",
        "07:10 AM",
      ],
      [
        "مقابل مستشفى ابن الهيثم (جسر المشاة)",
        "Opposite Ibn Al-Haytham Hospital (pedestrian bridge)",
        31.998518,
        35.872352,
        "تحت جسر المشاة مقابل مستشفى ابن الهيثم",
        "Under the pedestrian bridge opposite Ibn Al-Haytham Hospital",
        "07:18 AM",
      ],
      [
        "دوار الواحة (حبيبة)",
        "Al-Waha Roundabout (Habibeh)",
        31.98867,
        35.866872,
        "عند دوار الواحة قرب حلويات حبيبة",
        "At Al-Waha Roundabout near Habibeh Sweets",
        "07:25 AM",
      ],
      [
        "دوار الكيلو (جسر المشاة)",
        "Al-Kilo Roundabout (pedestrian bridge)",
        31.971271,
        35.86463,
        "عند دوار الكيلو أسفل جسر المشاة",
        "At Al-Kilo Roundabout under the pedestrian bridge",
        "07:32 AM",
      ],
      [
        "السابع (دوار السيفوي)",
        "7th Circle (Safeway Roundabout)",
        31.954169,
        35.857338,
        "عند دوار سيفوي في السابع",
        "At Safeway Roundabout on 7th Circle",
        "07:40 AM",
      ],
      [
        "كازية جولف (السابع)",
        "Golf Station (7th Circle)",
        31.942379,
        35.857223,
        "بجانب كازية جولف في السابع",
        "Beside the Golf fuel station on 7th Circle",
        "07:45 AM",
      ],
      [
        "كازية المناصير (جسر المشاة)",
        "Manaseer Station (pedestrian bridge)",
        31.919624,
        35.859053,
        "بجانب محطة المناصير عند جسر المشاة",
        "Beside Manaseer station at the pedestrian bridge",
        "07:55 AM",
      ],
    ]),
  },
  {
    id: 3,
    slug: "line-3",
    title: { ar: "خط عريفة مول", en: "Areefa Mall Line" },
    subtitle: { ar: "من عريفة مول وحتى محمص الشعب على طريق السلام", en: "From Areefa Mall to Al-Shaab Nuts Shop on Al-Salam Road" },
    badge: { ar: "الخط الثالث", en: "Line 3" },
    color: "#0EA5A5",
    stops: buildStops(3, [
      [
        "عريفة مول",
        "Areefa Mall",
        31.992506,
        35.934311,
        "أمام مدخل عريفة مول في طبربور",
        "In front of Areefa Mall entrance in Tabarbour",
        "07:00 AM",
      ],
      [
        "كازية Go (مجمع الشمال)",
        "Go Station (North Complex)",
        31.993998,
        35.921451,
        "محطة Go قبل مجمع الشمال",
        "Go fuel station before the North Complex",
        "07:06 AM",
      ],
      [
        "دوار المدينة الرياضية (بعد السيرفيس)",
        "Sports City Roundabout (after the service)",
        31.984842,
        35.89866,
        "عند دوار المدينة الرياضية بعد السيرفيس",
        "At Sports City Roundabout after the service stop",
        "07:14 AM",
      ],
      [
        "الداخلية (مجمع بنك الإسكان)",
        "Interior Ministry (Housing Bank Complex)",
        31.970882,
        35.907258,
        "بجانب مجمع بنك الإسكان",
        "Beside the Housing Bank complex",
        "07:20 AM",
      ],
      [
        "الدوار الرابع",
        "4th Circle",
        31.956087,
        35.895882,
        "على رصيف الدوار الرابع",
        "On the sidewalk of 4th Circle",
        "07:27 AM",
      ],
      [
        "دوار عبدون",
        "Abdoun Roundabout",
        31.948436,
        35.892195,
        "قرب دوار عبدون",
        "Near Abdoun Roundabout",
        "07:34 AM",
      ],
      [
        "تاج مول",
        "Taj Mall",
        31.941013,
        35.888717,
        "أمام مدخل تاج مول",
        "In front of Taj Mall entrance",
        "07:40 AM",
      ],
      [
        "كوريدور عبدون (كازية جوبيترول)",
        "Abdoun Corridor (Jopetrol Station)",
        31.92716,
        35.876121,
        "محطة جو بترول على كوردور عبدون",
        "Jo Petrol station on Abdoun Corridor",
        "07:46 AM",
      ],
      [
        "مرج الحمام (دوار البرديني)",
        "Marj Al-Hamam (Al-Bardini Roundabout)",
        31.902713,
        35.846609,
        "عند دوار البرديني في مرج الحمام",
        "At Al-Bardini Roundabout in Marj Al-Hamam",
        "07:45 AM",
      ],
      [
        "مرج الحمام (إشارات الكنيسة)",
        "Marj Al-Hamam (Church traffic lights)",
        31.898829,
        35.858485,
        "عند إشارات الكنيسة في مرج الحمام",
        "At the church traffic lights in Marj Al-Hamam",
        "07:50 AM",
      ],
      [
        "محمص الشعب (طريق السلام)",
        "Al-Shaab Nuts Shop (Al-Salam Road)",
        31.872623,
        35.83713,
        "محمص الشعب على طريق السلام",
        "Al-Shaab nuts shop on Al-Salam Road",
        "08:05 AM",
      ],
    ]),
  },
  {
    id: 4,
    slug: "line-4",
    title: { ar: "خط السلط", en: "Salt Line" },
    subtitle: { ar: "من مثلث جامعة البلقاء وحتى دوار الكمالية", en: "From Al-Balqa University triangle to Al-Kamaliya Roundabout" },
    badge: { ar: "الخط الرابع", en: "Line 4" },
    color: "#7C3AED",
    stops: buildStops(4, [
      [
        "مثلث جامعة البلقاء",
        "Al-Balqa University Triangle",
        32.021845,
        35.713487,
        "مثلث جامعة البلقاء التطبيقية",
        "Al-Balqa Applied University triangle",
        "07:00 AM",
        "https://maps.app.goo.gl/7YNEies2FAHa2LpK8?g_st=aw",
      ],
      [
        "جسر وادي حادي",
        "Wadi Hadi Bridge",
        32.03133,
        35.71377,
        "عند جسر وادي حادي",
        "At Wadi Hadi Bridge",
        "07:06 AM",
        "https://maps.app.goo.gl/2ACujcmjCPZE4Zgn8?g_st=aw",
      ],
      [
        "جسر المغاريب",
        "Al-Maghareeb Bridge",
        32.035233,
        35.702998,
        "قرب جسر المغاريب",
        "Near Al-Maghareeb Bridge",
        "07:12 AM",
        "https://maps.app.goo.gl/jMs2kNvwyAzbUuiE7?g_st=aw",
      ],
      [
        "جسر الدباس",
        "Al-Dabbas Bridge",
        32.051,
        35.7013,
        "عند جسر الدباس",
        "At Al-Dabbas Bridge",
        "07:18 AM",
        "https://maps.app.goo.gl/HEjV7NFpSvUsDRjY6?g_st=aw",
      ],
      [
        "مثلث المدينة الرياضية",
        "Sports City Triangle",
        32.060516,
        35.701256,
        "عند مثلث المدينة الرياضية",
        "At Sports City triangle",
        "07:30 AM",
        "https://maps.app.goo.gl/iHNsYTDDnpuc6jL47?g_st=aw",
      ],
      [
        "مجمع المناصير",
        "Manaseer Complex",
        32.065561,
        35.724067,
        "أمام مجمع المناصير",
        "In front of Manaseer Complex",
        "07:36 AM",
        "https://maps.app.goo.gl/KJ9by3ZuxU3PcSCr7?g_st=aw",
      ],
      [
        "إشارة الدفاع المدني",
        "Civil Defense Traffic Light",
        32.063353,
        35.737843,
        "عند إشارة الدفاع المدني",
        "At the Civil Defense traffic light",
        "07:42 AM",
        "https://maps.app.goo.gl/E6AS1PCsQZPzVtfaA?g_st=aw",
      ],
      [
        "جسر الدبابنة",
        "Al-Dababneh Bridge",
        32.057433,
        35.747394,
        "عند جسر الدبابنة",
        "At Al-Dababneh Bridge",
        "07:48 AM",
        "https://maps.app.goo.gl/vRPmrruaTCuc5cxn8?g_st=aw",
      ],
      [
        "إشارة عين الباشا",
        "Ain Al-Basha Traffic Light",
        32.040517,
        35.786078,
        "على إشارة عين الباشا",
        "At Ain Al-Basha traffic light",
        "07:54 AM",
        "https://maps.app.goo.gl/VNANJgRjRRocnGL37?g_st=aw",
      ],
      [
        "دوار أم النعاج",
        "Umm Al-Na'aj Roundabout",
        32.027538,
        35.798775,
        "عند دوار أم النعاج",
        "At Umm Al-Na'aj Roundabout",
        "08:00 AM",
        "https://maps.app.goo.gl/foga5s7ALZij5eqh6?g_st=aw",
      ],
      [
        "دوار الكمالية",
        "Al-Kamaliya Roundabout",
        32.028786,
        35.825091,
        "عند دوار الكمالية",
        "At Al-Kamaliya Roundabout",
        "08:06 AM",
        "https://maps.app.goo.gl/SoVksVXvTcgozzkQA?g_st=aw",
      ],
    ]),
  },
  {
    id: 5,
    slug: "line-5",
    title: { ar: "خط سحاب", en: "Sahab Line" },
    subtitle: {
      ar: "خط جنوب عمّان — من مدخل سحاب حتى دوار الياسمين",
      en: "South Amman line — from Sahab entrance to Al-Yasmeen Roundabout",
    },
    badge: { ar: "الخط الخامس", en: "Line 5" },
    color: "#0B2265",
    stops: buildStops(5, [
      // Each stop name matches its Maps link; landmark under it = district (المنطقة)
      [
        "الرجيب (بداية الخط)",
        "Al-Rajib (line start)",
        31.882115,
        35.992024,
        "الرجيب — جنوب سحاب",
        "Al-Rajib — south of Sahab",
        "06:55 AM",
        "https://maps.app.goo.gl/mBMLHg6oMoFqjMvk8",
      ],
      [
        "إشارة مدخل سحاب",
        "Sahab Entrance Traffic Light",
        31.892364,
        35.979775,
        "الرجيب — سحاب",
        "Al-Rajib — Sahab",
        "07:00 AM",
        "https://maps.app.goo.gl/ZNgp5S4AZgYYbXx18",
      ],
      [
        "صيدلية تلال سلوان (قبل جسر مرسيدس)",
        "Tilal Salwan Pharmacy (before Mercedes Bridge)",
        31.899619,
        35.960177,
        "أبو علندا — القويسمة",
        "Abu Alanda — Al-Quwaysimah",
        "07:08 AM",
        "https://maps.app.goo.gl/Pw5m7LqbHfhDP8bZ9",
      ],
      [
        "البنك الإسلامي (جسر أبو علندا)",
        "Islamic Bank (Abu Alanda Bridge)",
        31.901107,
        35.937695,
        "أبو علندا — القويسمة",
        "Abu Alanda — Al-Quwaysimah",
        "07:15 AM",
        "https://maps.app.goo.gl/bCCi7pw4n4tVbN839",
      ],
      [
        "دوار الجمرك",
        "Customs Roundabout",
        31.900479,
        35.931445,
        "المقابلين — شارع الحرية",
        "Al-Muqabalain — Al-Hurriyah St.",
        "07:22 AM",
        "https://maps.app.goo.gl/A1tc2aLaPp5E1Wez8",
      ],
      [
        "دوار الحويان",
        "Al-Huwayyan Roundabout",
        31.89598,
        35.91291,
        "المقابلين — أم قصير",
        "Al-Muqabalain — Umm Qusayr",
        "07:28 AM",
        "https://maps.app.goo.gl/67DCNjF37Hp1YBii8",
      ],
      [
        "إشارة أبو زغلة",
        "Abu Zaghla Traffic Light",
        31.896501,
        35.903098,
        "المقابلين — شارع الحرية",
        "Al-Muqabalain — Al-Hurriyah St.",
        "07:34 AM",
        "https://maps.app.goo.gl/3d8v7UYaCND4dB1n7",
      ],
      [
        "إشارة الحفاظ",
        "Al-Huffaz Traffic Light",
        31.902439,
        35.890802,
        "المقابلين — شارع الحرية",
        "Al-Muqabalain — Al-Hurriyah St.",
        "07:40 AM",
        "https://maps.app.goo.gl/XTmm9u83w197ropH6",
      ],
      [
        "تقاطع الإرسال",
        "Al-Irsal Intersection",
        31.911683,
        35.88144,
        "القويسمة",
        "Al-Quwaysimah",
        "07:46 AM",
        "https://maps.app.goo.gl/Tg1BUt8cTXpiAsCz5",
      ],
      [
        "إشارة حي الصحابة",
        "Hayy Al-Sahaba Traffic Light",
        31.914326,
        35.887165,
        "الياسمين — القويسمة",
        "Al-Yasmeen — Al-Quwaysimah",
        "07:52 AM",
        "https://maps.app.goo.gl/2a7K35KiW4CM8caBA",
      ],
      [
        "دوار قرقش",
        "Qarqash Roundabout",
        31.920333,
        35.894746,
        "القويسمة",
        "Al-Quwaysimah",
        "07:58 AM",
        "https://maps.app.goo.gl/jk6y5KDxbtRLY59x5",
      ],
      [
        "دوار الياسمين",
        "Al-Yasmeen Roundabout",
        31.9168,
        35.8892,
        "منطقة الياسمين — القويسمة",
        "Al-Yasmeen area — Al-Quwaysimah",
        "08:05 AM",
        // No Maps link was provided — pin placed in Al-Yasmeen near Hayy Al-Sahaba
      ],
    ]),
  },
];
export const getLineBySlug = (slug: string) => {
  const line = lines.find((l) => l.slug === slug);
  if (!line) return undefined;
  return { ...line, returnDepartures: getReturnDepartures(line.id) };
};

export type LineCardMeta = {
  slug: string;
  heading: Localized;
  badgeText: Localized;
  pathSnippet: Localized;
  accentGradient: string;
  badgeStyle: string;
  iconBg: string;
  shadowTint: string;
  busImage: string;
};

export const lineCardMeta: LineCardMeta[] = [
  {
    slug: "line-1",
    heading: { ar: "خط أبو نصير", en: "Abu Nseir Line" },
    badgeText: { ar: "الخط الأول • 10 محطات تجمع", en: "Line 1 • 10 pickup stops" },
    pathSnippet: {
      ar: "مسجد أبو نصير ⟵ صويلح ⟵ حدائق الحسين ⟵ كازية المناصير",
      en: "Abu Nseir Mosque ← Sweileh ← King Hussein Parks ← Manaseer Station",
    },
    accentGradient: "from-[#0A2240] to-[#0B2265]",
    badgeStyle: "bg-[#0A2240]/10 text-[#0A2240] dark:bg-white/10 dark:text-slate-100",
    iconBg: "bg-gradient-to-br from-[#0A2240] to-[#0B2265]",
    shadowTint: "rgba(10, 34, 64, 0.2)",
    busImage: heroFleetGallery,
  },
  {
    slug: "line-2",
    heading: { ar: "خط الاستشارات", en: "Consultations Line" },
    badgeText: { ar: "الخط الثاني • 9 محطات تجمع", en: "Line 2 • 9 pickup stops" },
    pathSnippet: {
      ar: "الاستشارات ⟵ دوار الواحة ⟵ السابع ⟵ كازية المناصير",
      en: "Consultations ← Al-Waha ← 7th Circle ← Manaseer Station",
    },
    accentGradient: "from-[#0A2240] to-[#0B2265]",
    badgeStyle: "bg-[#0A2240]/10 text-[#0A2240] dark:bg-white/10 dark:text-slate-100",
    iconBg: "bg-gradient-to-br from-[#0A2240] to-[#0B2265]",
    shadowTint: "rgba(10, 34, 64, 0.2)",
    busImage: fleetBoardingGallery,
  },
  {
    slug: "line-3",
    heading: { ar: "خط عريفة مول", en: "Areefa Mall Line" },
    badgeText: { ar: "الخط الثالث • 11 محطة تجمع", en: "Line 3 • 11 pickup stops" },
    pathSnippet: {
      ar: "عريفة مول ⟵ دوار عبدون ⟵ تاج مول ⟵ محمص الشعب",
      en: "Areefa Mall ← Abdoun ← Taj Mall ← Al-Shaab Nuts Shop",
    },
    accentGradient: "from-[#0A2240] to-[#0B2265]",
    badgeStyle: "bg-[#0A2240]/10 text-[#0A2240] dark:bg-white/10 dark:text-slate-100",
    iconBg: "bg-gradient-to-br from-[#0A2240] to-[#0B2265]",
    shadowTint: "rgba(10, 34, 64, 0.2)",
    busImage: fleetRoadGallery,
  },
  {
    slug: "line-4",
    heading: { ar: "خط السلط", en: "Salt Line" },
    badgeText: { ar: "الخط الرابع • 11 محطة تجمع", en: "Line 4 • 11 pickup stops" },
    pathSnippet: {
      ar: "مثلث جامعة البلقاء ⟵ جسر الدباس ⟵ إشارة عين الباشا ⟵ دوار الكمالية",
      en: "Al-Balqa University ← Al-Dabbas Bridge ← Ain Al-Basha ← Al-Kamaliya",
    },
    accentGradient: "from-[#0A2240] to-[#0B2265]",
    badgeStyle: "bg-[#0A2240]/10 text-[#0A2240] dark:bg-white/10 dark:text-slate-100",
    iconBg: "bg-gradient-to-br from-[#0A2240] to-[#0B2265]",
    shadowTint: "rgba(10, 34, 64, 0.2)",
    busImage: fleetInteriorGallery,
  },
  {
    slug: "line-5",
    heading: { ar: "خط سحاب — جنوب عمّان", en: "Sahab — South Amman Line" },
    badgeText: { ar: "الخط الخامس • 12 محطة تجمع", en: "Line 5 • 12 pickup stops" },
    pathSnippet: {
      ar: "الرجيب ⟵ مدخل سحاب ⟵ أبو علندا ⟵ دوار الياسمين",
      en: "Al-Rajib ← Sahab Entrance ← Abu Alanda ← Al-Yasmeen",
    },
    accentGradient: "from-[#0A2240] to-[#0B2265]",
    badgeStyle: "bg-[#0A2240]/10 text-[#0A2240] dark:bg-white/10 dark:text-slate-100",
    iconBg: "bg-gradient-to-br from-[#0A2240] to-[#0B2265]",
    shadowTint: "rgba(10, 34, 64, 0.2)",
    busImage: fleetRoadGallery,
  },
];

export const galleryImages = [
  {
    src: heroFleetGallery,
    alt: { ar: "حافلة يوتنغ من أسطول البريجي", en: "Yutong coach from the Al-Breeji fleet" },
  },
  {
    src: fleetBoardingGallery,
    alt: { ar: "حافلة البريجي السياحية الفاخرة", en: "Premium Al-Breeji tourist coach" },
  },
  {
    src: fleetRoadGallery,
    alt: { ar: "حافلة مرسيدس من أسطول البريجي", en: "Mercedes coach from the Al-Breeji fleet" },
  },
  {
    src: fleetInteriorGallery,
    alt: { ar: "حافلة مرسيدس VIP من البريجي", en: "Al-Breeji Mercedes VIP coach" },
  },
];

export type FleetServiceTheme =
  | "fleet-hero"
  | "fleet-road"
  | "fleet-4555"
  | "fleet-4557"
  | "fleet-2728"
  | "fleet-2908"
  | "fleet-3386"
  | "fleet-3874"
  | "fleet-3950"
  | "fleet-3954"
  | "fleet-3963"
  | "fleet-4378"
  | "fleet-4594"
  | "fleet-4735"
  | "fleet-4848"
  | "fleet-9945";

export type FleetServiceCard = {
  id: FleetServiceTheme;
  image: string;
  title: Localized;
  description: Localized;
  rating: number;
  href: string;
};

const fleetPhoto = (
  id: FleetServiceTheme,
  image: string,
  rating: number,
): FleetServiceCard => ({
  id,
  image,
  title: { ar: "أسطول البريجي", en: "Al-Breeji fleet" },
  description: {
    ar: "حافلة من أسطول البريجي — لقطة خارجية كاملة.",
    en: "A full exterior view from the Al-Breeji coach fleet.",
  },
  rating,
  href: "#lines",
});

/** Full exterior coach shots only — no interiors, rears, or heavily cropped frames. */
export const fleetServiceCards: FleetServiceCard[] = [
  fleetPhoto("fleet-9945", fleetBus9945, 4.9),
  fleetPhoto("fleet-3386", fleetBus3386, 4.9),
  fleetPhoto("fleet-3954", fleetBus3954, 4.9),
  fleetPhoto("fleet-4378", fleetBus4378, 4.8),
  fleetPhoto("fleet-road", fleetRoadGallery, 4.8),
  fleetPhoto("fleet-2908", fleetBus2908, 4.8),
  fleetPhoto("fleet-4848", fleetBus4848, 4.9),
  fleetPhoto("fleet-4594", fleetBus4594, 4.8),
  fleetPhoto("fleet-4735", fleetBus4735, 4.9),
];

export { heroFleet, heroFleetVideo };
