const cache = new Map();
const TTL = 30 * 60 * 1000;

async function getWeather(lat, lon) {
  const la = Number(lat).toFixed(2);
  const lo = Number(lon).toFixed(2);
  const key = `${la},${lo}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation` +
    `&daily=precipitation_sum&past_days=3&forecast_days=3&timezone=Asia%2FKolkata`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Weather service ${res.status}`);
  const j = await res.json();
  const sum = (arr) => arr.reduce((s, v) => s + (v || 0), 0);
  const rain = j.daily?.precipitation_sum || [];
  const data = {
    temperatureC: j.current?.temperature_2m ?? null,
    humidityPct: j.current?.relative_humidity_2m ?? null,
    rainLast3DaysMm: rain.length >= 6 ? Number(sum(rain.slice(0, 3)).toFixed(1)) : null,
    rainNext3DaysMm: rain.length >= 6 ? Number(sum(rain.slice(3, 6)).toFixed(1)) : null,
    source: 'Open-Meteo',
  };
  cache.set(key, { at: Date.now(), data });
  return data;
}

module.exports = { getWeather };