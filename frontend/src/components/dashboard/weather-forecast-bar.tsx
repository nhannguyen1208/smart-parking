"use client";

import { useEffect, useState } from "react";

type HourSlot = {
  time: string;
  label: string;
  temp: number;
  code: number;
  precip: number;
};

type WeatherSnapshot = {
  location: string;
  currentTemp: number;
  currentCode: number;
  humidity: number;
  wind: number;
  hours: HourSlot[];
};

const DANANG = { lat: 16.0544, lon: 108.2022 };
const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${DANANG.lat}&longitude=${DANANG.lon}` +
  `&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m` +
  `&hourly=temperature_2m,weather_code,precipitation_probability` +
  `&forecast_days=2&timezone=Asia%2FHo_Chi_Minh`;

function conditionLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Showers";
  if (code <= 82) return "Heavy rain";
  if (code <= 86) return "Snow";
  return "Storm";
}

function WeatherIcon({ code, className = "" }: { code: number; className?: string }) {
  if (code === 0) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (code <= 3) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
        <path
          d="M7.5 16.5h9.2a3.3 3.3 0 0 0 .2-6.6 4.6 4.6 0 0 0-8.7-1.4A3.4 3.4 0 0 0 7.5 16.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="17.2" cy="7.2" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (code <= 67 || (code >= 80 && code <= 82)) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
        <path
          d="M7.5 14.2h9.2a3.3 3.3 0 0 0 .2-6.6 4.6 4.6 0 0 0-8.7-1.4A3.4 3.4 0 0 0 7.5 14.2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 17.2 8 20M12 17.2 11 20M15 17.2 14 20"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M7.5 15h9.2a3.3 3.3 0 0 0 .2-6.6 4.6 4.6 0 0 0-8.7-1.4A3.4 3.4 0 0 0 7.5 15Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m10 17.5 1.6 2.4L13 17.5l1.6 2.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatHourLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function WeatherForecastBar() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(WEATHER_URL)
      .then((res) => {
        if (!res.ok) throw new Error("weather unavailable");
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;

        const now = Date.now();
        const times: string[] = payload.hourly?.time ?? [];
        const temps: number[] = payload.hourly?.temperature_2m ?? [];
        const codes: number[] = payload.hourly?.weather_code ?? [];
        const precip: number[] = payload.hourly?.precipitation_probability ?? [];

        const hours: HourSlot[] = [];
        for (let i = 0; i < times.length && hours.length < 8; i += 1) {
          const ts = new Date(times[i]).getTime();
          if (ts < now - 30 * 60 * 1000) continue;
          hours.push({
            time: times[i],
            label: hours.length === 0 ? "Now" : formatHourLabel(times[i]),
            temp: Math.round(temps[i]),
            code: codes[i],
            precip: precip[i] ?? 0,
          });
        }

        setWeather({
          location: "VNUK · Đà Nẵng",
          currentTemp: Math.round(payload.current?.temperature_2m ?? hours[0]?.temp ?? 0),
          currentCode: payload.current?.weather_code ?? hours[0]?.code ?? 0,
          humidity: Math.round(payload.current?.relative_humidity_2m ?? 0),
          wind: Math.round(payload.current?.wind_speed_10m ?? 0),
          hours,
        });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="animate-fade-up-delay-1 rounded-[14px] border border-border/80 bg-gradient-to-r from-[#eef5fb] via-white to-[#f7fafc] px-4 py-3 text-sm text-muted">
        Campus weather forecast is temporarily unavailable.
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="animate-fade-up-delay-1 h-[120px] animate-pulse rounded-[16px] bg-surface" />
    );
  }

  return (
    <section
      aria-label="Campus weather forecast"
      className="animate-fade-up-delay-1 overflow-hidden rounded-[16px] border border-border/80 bg-gradient-to-r from-[#e8f1fa] via-white to-[#f3f8fc] shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-stretch sm:gap-0 md:px-6 md:py-6">
        <div className="flex min-w-[220px] items-center gap-4 border-border/70 sm:border-r sm:pr-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
            <WeatherIcon code={weather.currentCode} className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              {weather.location}
            </p>
            <p className="mt-1 text-[34px] font-semibold leading-none tracking-tight text-navy">
              {weather.currentTemp}°
              <span className="ml-2.5 text-base font-medium text-muted">
                {conditionLabel(weather.currentCode)}
              </span>
            </p>
            <p className="mt-1.5 text-sm text-muted">
              Humidity {weather.humidity}% · Wind {weather.wind} km/h
            </p>
          </div>
        </div>

        <div className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 sm:pl-5 md:gap-2 md:pl-6">
          {weather.hours.map((hour) => (
            <div
              key={hour.time}
              className="flex min-w-[80px] flex-col items-center rounded-[12px] px-2.5 py-2.5 text-center transition-colors hover:bg-white/70"
            >
              <span className="text-xs font-medium text-muted">{hour.label}</span>
              <WeatherIcon
                code={hour.code}
                className="mt-2 h-6 w-6 text-brand-blue"
              />
              <span className="mt-1.5 text-base font-semibold text-navy">{hour.temp}°</span>
              <span className="mt-1 text-[11px] text-muted">{hour.precip}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
