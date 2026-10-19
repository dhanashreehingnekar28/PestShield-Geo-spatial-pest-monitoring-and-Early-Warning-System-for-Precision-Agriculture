import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';

const farmIcon = L.divIcon({
  className: 'farm-location-marker',
  html: '<span style="font-size:30px;line-height:1">📍</span>',
  iconSize: [32, 36],
  iconAnchor: [16, 34]
});

const districtIcon = L.divIcon({
  className: 'district-reference-marker',
  html: '<span style="font-size:28px;line-height:1">🔵</span>',
  iconSize: [32, 36],
  iconAnchor: [16, 34]
});

function LocationSelector({ position, onChange }) {
  useMapEvents({
    click(event) {
      onChange(
        {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng
        },
        'FarmSelected'
      );
    }
  });

  if (!position) return null;

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={farmIcon}
      draggable={true}
      autoPan={true}
      eventHandlers={{
        dragend(event) {
          const marker = event.target;
          const point = marker.getLatLng();

          onChange(
            {
              latitude: point.lat,
              longitude: point.lng
            },
            'FarmSelected'
          );
        }
      }}
    >
      <Popup>
        <strong>Selected Farm Location</strong>
        <br />
        Drag this marker to your actual field.
      </Popup>
    </Marker>
  );
}

function FocusLocation({ focusPosition }) {
  const map = useMap();

  useEffect(() => {
    if (!focusPosition) return;

    map.flyTo(
      [focusPosition.latitude, focusPosition.longitude],
      12,
      {
        animate: true,
        duration: 1
      }
    );
  }, [focusPosition, map]);

  return null;
}

export default function FarmLocationPicker({
  position,
  onChange,
  focusPosition = null,
  districtName = ''
}) {
  const [gpsError, setGpsError] = useState('');
  const [locating, setLocating] = useState(false);

  const locateFarm = () => {
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('GPS is not supported by this browser.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        onChange(
          {
            latitude: result.coords.latitude,
            longitude: result.coords.longitude
          },
          'DeviceGPS'
        );

        setLocating(false);
      },
      () => {
        setGpsError(
          'Could not get your location. Please select the farm manually.'
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <div>
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        maxZoom={19}
        minZoom={5}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        style={{
          width: '100%',
          height: '450px',
          borderRadius: '10px'
        }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street Map">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={17}
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {focusPosition && (
          <Marker
            position={[
              focusPosition.latitude,
              focusPosition.longitude
            ]}
            icon={districtIcon}
          >
            <Popup>
              {districtName || 'Selected district'}
              <br />
              Approximate district reference.
              Not your farm location.
            </Popup>
          </Marker>
        )}

        <LocationSelector
          position={position}
          onChange={onChange}
        />

        <FocusLocation focusPosition={focusPosition} />
      </MapContainer>

      <div style={{ marginTop: '10px' }}>
        <button
          type="button"
          onClick={locateFarm}
          disabled={locating}
          style={{
            padding: '9px 14px',
            border: '1px solid #287e32',
            borderRadius: '6px',
            background: '#fff',
            color: '#287e32',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {locating ? 'Locating...' : '📍 Use My Current Location'}
        </button>
      </div>

      {gpsError && (
        <small style={{ color: '#b42318', display: 'block' }}>
          {gpsError}
        </small>
      )}

      <small style={{ display: 'block', marginTop: '8px' }}>
        Use GPS only when you are physically at your farm.
        Otherwise, switch to Satellite View and select your
        actual field manually.
      </small>
    </div>
  );
}