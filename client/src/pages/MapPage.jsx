import L from 'leaflet';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import api from '../api/axios';
import BackButton from '../components/BackButton';
import MapDetailPanel from '../components/MapDetailPanel';

const RISK_COLORS = {
  Low: '#e0b400',
  Medium: '#f08a24',
  High: '#d62f2f'
};

const GREEN = '#2d6a3e';
const APPROXIMATE_COLOR = '#78838a';

const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px 16px'
  },
  title: {
    margin: '0 0 4px',
    color: '#1c2b20'
  },
  sub: {
    margin: '0 0 20px',
    color: '#5b6b60',
    fontSize: 14
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 12,
    marginBottom: 16
  },
  stat: {
    background: '#fff',
    borderRadius: 10,
    padding: '14px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,.08)'
  },
  statNum: {
    fontSize: 26,
    fontWeight: 700,
    color: GREEN
  },
  statLabel: {
    fontSize: 13,
    color: '#5b6b60'
  },
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    background: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,.08)'
  },
  select: {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #cfd8d0',
    background: '#fff'
  },
  check: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14
  },
  mapWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,.15)'
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
    fontSize: 13,
    color: '#334'
  },
  dot: (color) => ({
    display: 'inline-block',
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: color,
    marginRight: 6,
    verticalAlign: 'middle'
  }),
  error: {
    background: '#fdecea',
    color: '#a12622',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  }
};

function hasValidCoordinates(feature) {
  const coords = feature?.geometry?.coordinates;

  return (
    Array.isArray(coords) &&
    coords.length >= 2 &&
    Number.isFinite(coords[0]) &&
    Number.isFinite(coords[1]) &&
    coords[0] >= -180 &&
    coords[0] <= 180 &&
    coords[1] >= -90 &&
    coords[1] <= 90
  );
}

function hasValidFarmCoordinates(farm) {
  return (
    typeof farm?.latitude === 'number' &&
    typeof farm?.longitude === 'number' &&
    Number.isFinite(farm.latitude) &&
    Number.isFinite(farm.longitude) &&
    farm.latitude >= -90 &&
    farm.latitude <= 90 &&
    farm.longitude >= -180 &&
    farm.longitude <= 180
  );
}

function calculateWeatherRisk(weather) {
  if (!weather) {
    return null;
  }

  const temperature = Number(weather.temperature);
  const humidity = Number(weather.humidity);
  const precipitation = Number(weather.precipitation);

  if (
    !Number.isFinite(temperature) ||
    !Number.isFinite(humidity) ||
    !Number.isFinite(precipitation)
  ) {
    return null;
  }

  let score = 0;
  const reasons = [];

  if (humidity >= 85) {
    score += 2;
    reasons.push('Very high humidity');
  } else if (humidity >= 70) {
    score += 1;
    reasons.push('Elevated humidity');
  }

  if (temperature >= 20 && temperature <= 32) {
    score += 1;
    reasons.push('Moderate to warm temperature');
  }

  if (precipitation > 0) {
    score += 1;
    reasons.push('Precipitation reported');
  }

  if (score >= 4) {
    return {
      level: 'High',
      color: '#d62f2f',
      background: '#fff0f0',
      reasons
    };
  }

  if (score >= 2) {
    return {
      level: 'Medium',
      color: '#b76a12',
      background: '#fff5e8',
      reasons
    };
  }

  return {
    level: 'Low',
    color: '#2d6a3e',
    background: '#eef7ef',
    reasons
  };
}

function FarmWeather({ farmId }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setWeather(null);
    setError('');

    api
      .get(`/weather/farm/${farmId}`, {
        signal: controller.signal
      })
      .then((res) => {
        if (!controller.signal.aborted) {
          setWeather(res.data?.data?.weather ?? null);
        }
      })
      .catch((err) => {
        if (
          !controller.signal.aborted &&
          err.code !== 'ERR_CANCELED'
        ) {
          setError(
            err.response?.data?.message ||
            'Weather information is unavailable'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [farmId]);

  const weatherRisk = calculateWeatherRisk(weather);
  const displayValue = (value, unit) => {
    return typeof value === 'number' &&
      Number.isFinite(value)
      ? `${value}${unit}`
      : 'Not available';
  };

  return (
    <div
      style={{
        borderTop: '1px solid #e2e8e3',
        marginTop: 10,
        paddingTop: 10
      }}
    >
      <strong style={{ color: GREEN, fontSize: 14 }}>
        Current Weather
      </strong>

      {loading && (
        <div style={{ marginTop: 6 }}>
          Loading weather...
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            color: '#a12622',
            marginTop: 6
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && !weather && (
        <div>Weather information unavailable.</div>
      )}

      {!loading && !error && weather && (
        <div style={{ marginTop: 6, lineHeight: 1.8 }}>
          <div>
            🌡️ <strong>Temperature:</strong>{' '}
            {displayValue(weather.temperature, ' °C')}
          </div>

          <div>
            💧 <strong>Humidity:</strong>{' '}
            {displayValue(weather.humidity, '%')}
          </div>

          <div>
            🌧️ <strong>Precipitation:</strong>{' '}
            {displayValue(weather.precipitation, ' mm')}
          </div>

          <div>
            💨 <strong>Wind speed:</strong>{' '}
            {displayValue(weather.windSpeed, ' km/h')}
          </div>
          
          {weatherRisk && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 8,
                background: weatherRisk.background,
                border: `1px solid ${weatherRisk.color}`
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: weatherRisk.color
                }}
              >
                Weather-based pest risk: {weatherRisk.level}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#445',
                  marginTop: 5
                }}
              >
                {weatherRisk.reasons.length > 0
                  ? weatherRisk.reasons.join(' · ')
                  : 'No elevated conditions detected by these rules'}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: '#667',
                  marginTop: 7
                }}
              >
                Preliminary weather screening only.
                Not a confirmed pest outbreak or validated
                crop-specific prediction.
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: '#667'
            }}
          >
            Weather time: {weather.observedAt || 'Unknown'}
            {weather.timezone
              ? ` (${weather.timezone})`
              : ''}
          </div>

          <div
            style={{
              fontSize: 11,
              color: '#667'
            }}
          >
            Source: Open-Meteo. Location-based weather
            estimates, not measurements from a farm sensor.
          </div>
        </div>
      )}
    </div>
  );
}


function FitBounds({
  points,
  zones,
  showZones,
  crop,
  days,
  loading,
  data
}) {
  const map = useMap();
  const lastFitKey = useRef(null);

  useEffect(() => {
    if (loading || !data) return;

    const validZones = showZones
      ? zones.filter(
          (zone) =>
            hasValidCoordinates(zone) &&
            Number.isFinite(Number(zone.properties?.radiusKm)) &&
            Number(zone.properties.radiusKm) > 0
        )
      : [];

    const bounds = L.latLngBounds([]);

    if (validZones.length > 0) {
      validZones.forEach((zone) => {
        const [longitude, latitude] =
          zone.geometry.coordinates;

        const radiusMetres =
          Number(zone.properties.radiusKm) * 1000;

        const latitudeOffset = radiusMetres / 111320;

        const longitudeOffset =
          radiusMetres /
          (111320 *
            Math.max(
              Math.abs(Math.cos(latitude * Math.PI / 180)),
              0.000001
            ));

        bounds.extend([
          latitude - latitudeOffset,
          longitude - longitudeOffset
        ]);

        bounds.extend([
          latitude + latitudeOffset,
          longitude + longitudeOffset
        ]);
      });
    } else {
      points.forEach((point) => {
        if (
          Array.isArray(point) &&
          point.length === 2 &&
          Number.isFinite(point[0]) &&
          Number.isFinite(point[1])
        ) {
          bounds.extend(point);
        }
      });
    }

    if (!bounds.isValid()) return;

    const fitKey = JSON.stringify({
      crop,
      days,
      showZones,
      zones: validZones.map((zone) => ({
        id: zone.properties?.id,
        coordinates: zone.geometry.coordinates,
        radiusKm: zone.properties?.radiusKm
      })),
      points: validZones.length === 0 ? points : []
    });

    if (lastFitKey.current === fitKey) return;

    lastFitKey.current = fitKey;

    if (validZones.length > 0) {
      map.fitBounds(bounds, {
        padding: [65, 65],
        maxZoom: 14,
        animate: true
      });
    } else if (points.length === 1) {
      map.setView(points[0], 11);
    } else {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 12,
        animate: true
      });
    }
  }, [
    map,
    points,
    zones,
    showZones,
    crop,
    days,
    loading,
    data
  ]);

  return null;
}

export default function MapPage() {
  const [crop, setCrop] = useState('');
  const [days, setDays] = useState('30');

  const [showReports, setShowReports] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showFarms, setShowFarms] = useState(false);

  const [mapView, setMapView] = useState('street');

  const [data, setData] = useState(null);
  const [farms, setFarms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [farmsLoading, setFarmsLoading] = useState(false);

  const [error, setError] = useState('');
  const [farmsError, setFarmsError] = useState('');

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setSelected(null);
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');
    setData(null);

    api
      .get('/map/data', {
        params: {
          crop: crop || undefined,
          days: days || undefined
        },
        signal: controller.signal
      })
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res.data.data);
        }
      })
      .catch((err) => {
        if (
          !controller.signal.aborted &&
          err.code !== 'ERR_CANCELED'
        ) {
          setError(
            err.response?.data?.message ||
            'Could not load map data'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [crop, days]);

  useEffect(() => {
    if (!showFarms) return;

    const controller = new AbortController();

    setFarmsLoading(true);
    setFarmsError('');

    api
      .get('/farms/map', {
        signal: controller.signal
      })
      .then((res) => {
        if (!controller.signal.aborted) {
          setFarms(
            Array.isArray(res.data.data)
              ? res.data.data
              : []
          );
        }
      })
      .catch((err) => {
        if (
          !controller.signal.aborted &&
          err.code !== 'ERR_CANCELED'
        ) {
          setFarmsError(
            err.response?.data?.message ||
            'Could not load farm locations'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setFarmsLoading(false);
        }
      });

    return () => controller.abort();
  }, [showFarms]);

  const reports = useMemo(
    () => data?.reports?.features ?? [],
    [data]
  );

  const zones = useMemo(
    () => data?.outbreaks?.features ?? [],
    [data]
  );

  const visibleFarms = useMemo(() => {
    if (!showFarms) return [];

    return farms.filter((farm) => {
      return (
        hasValidFarmCoordinates(farm) &&
        (!crop || farm.cropType === crop)
      );
    });
  }, [farms, crop, showFarms]);

  const points = useMemo(() => {
    const visibleFeatures = [
      ...(showReports ? reports : []),
      ...(showZones ? zones : [])
    ];

    const reportAndZonePoints = visibleFeatures
      .filter(hasValidCoordinates)
      .map((feature) => [
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0]
      ]);

    const farmPoints = visibleFarms.map((farm) => [
      farm.latitude,
      farm.longitude
    ]);

    return [...reportAndZonePoints, ...farmPoints];
  }, [
    reports,
    zones,
    showReports,
    showZones,
    visibleFarms
  ]);

  return (
    <div style={styles.page}>
      <BackButton />

      <h2 style={styles.title}>Outbreak Map</h2>

      <p style={styles.sub}>
        Verified pest reports, registered farm locations
        and active outbreak zones, colour-coded by risk level.
      </p>

      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {showFarms && farmsError && (
        <div style={styles.error}>{farmsError}</div>
      )}

      <div style={styles.stats}>
        <div style={styles.stat}>
          <div style={styles.statNum}>
            {data?.summary.totalReports ?? '–'}
          </div>
          <div style={styles.statLabel}>
            Verified reports
          </div>
        </div>

        <div style={styles.stat}>
          <div style={styles.statNum}>
            {data?.summary.totalOutbreakZones ?? '–'}
          </div>
          <div style={styles.statLabel}>
            Outbreak zones
          </div>
        </div>

        <div style={styles.stat}>
          <div
            style={{
              ...styles.statNum,
              color: RISK_COLORS.High
            }}
          >
            {data?.summary.highRiskZones ?? '–'}
          </div>
          <div style={styles.statLabel}>
            High-risk zones
          </div>
        </div>
      </div>

      <div style={styles.bar}>
        <select
          style={styles.select}
          value={mapView}
          onChange={(e) => setMapView(e.target.value)}
          aria-label="Map view"
        >
          <option value="street">Street Map</option>
          <option value="satellite">Satellite View</option>
        </select>

        <select
          style={styles.select}
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
        >
          <option value="">All crops</option>
          <option value="Groundnut">Groundnut</option>
          <option value="Potato">Potato</option>
          <option value="Chilli">Chilli</option>
        </select>

        <select
          style={styles.select}
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="">All time</option>
        </select>

        <label style={styles.check}>
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) =>
              setShowZones(e.target.checked)
            }
          />
          Outbreak zones
        </label>

        <label style={styles.check}>
          <input
            type="checkbox"
            checked={showReports}
            onChange={(e) =>
              setShowReports(e.target.checked)
            }
          />
          Reports
        </label>

        <label style={styles.check}>
          <input
            type="checkbox"
            checked={showFarms}
            onChange={(e) =>
              setShowFarms(e.target.checked)
            }
          />
          Farms
        </label>

        {(loading || farmsLoading) && (
          <span
            style={{
              color: '#5b6b60',
              fontSize: 13
            }}
          >
            Loading…
          </span>
        )}
      </div>

      <div style={styles.mapWrap}>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          minZoom={3}
          maxZoom={19}
          zoomControl={true}
          dragging={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
          boxZoom={true}
          keyboard={true}
          style={{
            height: 560,
            width: '100%',
            cursor: 'grab'
          }}
        >
          {mapView === 'street' ? (
            <TileLayer
              key="street"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              key="satellite"
              attribution='Tiles &copy; Esri and its imagery providers'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}

          <FitBounds
            points={points}
            zones={zones}
            showZones={showZones}
            crop={crop}
            days={days}
            loading={loading}
            data={data}
          />

          {showZones &&
            zones
              .filter(hasValidCoordinates)
              .map((zone) => {
                const properties = zone.properties;
                const [longitude, latitude] =
                  zone.geometry.coordinates;

                const color =
                  RISK_COLORS[properties.riskLevel] ||
                  RISK_COLORS.Low;

                const isSelected =
                  selected?.type === 'zone' &&
                  String(selected.id) ===
                    String(properties.id);

                return (
                  <Fragment key={properties.id}>
                    <Circle
                      center={[latitude, longitude]}
                      radius={properties.radiusKm * 1000}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: isSelected ? 0.35 : 0.22,
                        weight: isSelected ? 5 : 3,
                        opacity: 1
                      }}
                      eventHandlers={{
                        click: () =>
                          setSelected({
                            type: 'zone',
                            id: properties.id
                          })
                      }}
                    />

                    <CircleMarker
                      center={[latitude, longitude]}
                      radius={50}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: 0.18,
                        weight: 3
                      }}
                      eventHandlers={{
                        click: () =>
                          setSelected({
                            type: 'zone',
                            id: properties.id
                          })
                      }}
                    />
                  </Fragment>
                );
              })}

          {showReports &&
            reports
              .filter(hasValidCoordinates)
              .map((report) => {
                const properties = report.properties;
                const [longitude, latitude] =
                  report.geometry.coordinates;

                const isSelected =
                  selected?.type === 'report' &&
                  String(selected.id) ===
                    String(properties.id);

                return (
                  <CircleMarker
                    key={properties.id}
                    center={[latitude, longitude]}
                    radius={isSelected ? 8 : 5}
                    pathOptions={{
                      color: isSelected
                        ? '#1f2a1f'
                        : '#fff',
                      weight: 2,
                      fillColor:
                        RISK_COLORS[properties.severity] ||
                        RISK_COLORS.Low,
                      fillOpacity: 0.95
                    }}
                    eventHandlers={{
                      click: () =>
                        setSelected({
                          type: 'report',
                          id: properties.id
                        })
                    }}
                  />
                );
              })}

          {showFarms &&
            visibleFarms.map((farm) => {
              const isFarmSelected =
                farm.locationSource === 'FarmSelected' ||
                farm.locationSource === 'DeviceGPS';

              const markerColor = isFarmSelected
                ? GREEN
                : APPROXIMATE_COLOR;

              return (
                <CircleMarker
                  key={`farm-${farm.id}`}
                  center={[
                    farm.latitude,
                    farm.longitude
                  ]}
                  radius={9}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 2,
                    fillColor: markerColor,
                    fillOpacity: 0.95
                  }}
                >
                  <Popup>
                    <div
                      style={{
                        minWidth: 190,
                        lineHeight: 1.6
                      }}
                    >
                      <strong
                        style={{
                          color: GREEN,
                          fontSize: 15
                        }}
                      >
                        {farm.farmName || 'Unnamed farm'}
                      </strong>

                      <div>
                        <strong>Crop:</strong>{' '}
                        {farm.cropType || 'Not specified'}
                      </div>

                      <div>
                        <strong>District:</strong>{' '}
                        {farm.district || 'Not specified'}
                      </div>

                      <div>
                        <strong>Location:</strong>{' '}
                        {isFarmSelected
                          ? 'Farmer-selected location'
                          : farm.locationSource ===
                            'DistrictApproximate'
                          ? 'Approximate district location'
                          : 'Unverified location'}
                      </div>

                      <div>
                        <strong>Latitude:</strong>{' '}
                        {farm.latitude.toFixed(5)}
                      </div>

                      <div>
                        <strong>Longitude:</strong>{' '}
                        {farm.longitude.toFixed(5)}
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: '#667'
                        }}
                      >
                        Coordinates are user-provided
                        and are not independently verified.
                      </div>
                      <FarmWeather farmId={farm.id} />
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>

        <MapDetailPanel
          selected={selected}
          zones={zones}
          reports={reports}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      </div>

      <div style={styles.legend}>
        <span>
          <span style={styles.dot(RISK_COLORS.Low)} />
          Low risk
        </span>

        <span>
          <span style={styles.dot(RISK_COLORS.Medium)} />
          Medium risk
        </span>

        <span>
          <span style={styles.dot(RISK_COLORS.High)} />
          High risk
        </span>

        <span>
          <span style={styles.dot(GREEN)} />
          Selected farm location
        </span>

        <span>
          <span style={styles.dot(APPROXIMATE_COLOR)} />
          Approximate/unverified farm location
        </span>

        <span>
          Large shaded circles are outbreak zones.
          Small orange, yellow or red dots are pest reports.
          Green and grey dots are registered farms.
          Click a marker for details.
        </span>
      </div>
    </div>
  );
}