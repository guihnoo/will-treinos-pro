import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge";

export interface HourlySlot {
  time: string;        // "2026-05-29T18:00"
  precipProb: number;  // 0-100
  weatherCode: number;
  temp: number;
}

export interface CourtForecastResult {
  lat: number;
  lng: number;
  label: string;
  today: HourlySlot[];
  tomorrow: HourlySlot[];
  rainAlertTimes: string[];  // ISO times with precipProb > 60
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const client = createClient(supabaseUrl, serviceKey);
  const { data: settings } = await client
    .from("app_settings")
    .select("court_location")
    .limit(1)
    .maybeSingle();

  const court = settings?.court_location as { lat?: number; lng?: number; label?: string } | null;
  if (!court?.lat || !court?.lng) {
    return NextResponse.json({ error: "no_court_configured" }, { status: 404 });
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${court.lat}&longitude=${court.lng}` +
    `&hourly=precipitation_probability,weathercode,temperature_2m` +
    `&timezone=America%2FSao_Paulo&forecast_days=2`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = (await res.json()) as {
      hourly: {
        time: string[];
        precipitation_probability: number[];
        weathercode: number[];
        temperature_2m: number[];
      };
    };

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

    const allSlots: HourlySlot[] = (data.hourly.time ?? []).map((t, i) => ({
      time: t,
      precipProb: data.hourly.precipitation_probability[i] ?? 0,
      weatherCode: data.hourly.weathercode[i] ?? 0,
      temp: Math.round(data.hourly.temperature_2m[i] ?? 0),
    }));

    const today = allSlots.filter((h) => h.time.startsWith(todayStr));
    const tomorrow = allSlots.filter((h) => h.time.startsWith(tomorrowStr));
    const rainAlertTimes = allSlots
      .filter((h) => h.precipProb > 60 || h.weatherCode >= 51)
      .map((h) => h.time);

    return NextResponse.json({
      lat: court.lat,
      lng: court.lng,
      label: court.label ?? "Quadra",
      today,
      tomorrow,
      rainAlertTimes,
    } satisfies CourtForecastResult);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
