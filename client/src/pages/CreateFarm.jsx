import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FarmLocationPicker from '../components/FarmLocationPicker';

import indiaDistricts from '../data/indiaDistricts.json';
import api from '../api/axios';

function localToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const states = Object.entries(indiaDistricts)
  .map(([stateCode, state]) => ({
    stateCode,
    stateName: state.stateName,
    districts: state.districts
  }))
  .sort((a, b) => a.stateName.localeCompare(b.stateName));

export default function CreateFarm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    farmName: '',
    cropType: 'Groundnut',
    sowingDate: localToday(),
    stateCode: '',
    districtCode: ''
  });

  const [farmPosition, setFarmPosition] = useState(null);
  const [focusPosition, setFocusPosition] = useState(null);
  const [locationSource, setLocationSource] = useState(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedState = useMemo(
    () => states.find(
      (state) => state.stateCode === form.stateCode
    ),
    [form.stateCode]
  );

  const districts = selectedState?.districts || [];

  const selectedDistrict = districts.find(
    (district) => district.districtCode === form.districtCode
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setError('');
  };

  const handleStateChange = (event) => {
    setForm((previous) => ({
      ...previous,
      stateCode: event.target.value,
      districtCode: ''
    }));

    // Clear the old farm marker, focus, search query, location source, and confirmation when switching states.
    setFarmPosition(null);
    setFocusPosition(null);
    setLocationQuery('');
    setLocationSource(null);
    setLocationConfirmed(false);
    setError('');
  };

  const handleDistrictChange = async (event) => {
    const districtCode = event.target.value;

    setForm((previous) => ({
      ...previous,
      districtCode
    }));

    setFarmPosition(null);
    setFocusPosition(null);
    setLocationQuery('');
    setLocationSource(null);
    setLocationConfirmed(false);
    setError('');

    const district = districts.find(
      (item) => item.districtCode === districtCode
    );

    if (!district || !selectedState) return;

    try {
      const params = new URLSearchParams({
        q: `${district.districtName}, ${selectedState.stateName}, India`,
        format: 'json',
        limit: '1',
        countrycodes: 'in'
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`
      );

      if (!response.ok) {
        throw new Error('Location lookup failed');
      }

      const results = await response.json();

      if (results.length > 0) {
        setFocusPosition({
          latitude: Number(results[0].lat),
          longitude: Number(results[0].lon)
        });
      } else {
        setError(
          'District location could not be found automatically. ' +
          'Please navigate to your farm manually on the map.'
        );
      }
    } catch (err) {
      console.error('District geocoding error:', err);

      setError(
        'Could not load district location. ' +
        'Please navigate manually on the map.'
      );
    }
  };

  const handleSearchLocation = async () => {
    const query = locationQuery.trim();

    if (!query) {
      setError('Enter a village, pincode or nearby landmark.');
      return;
    }

    if (!selectedState || !selectedDistrict) {
      setError('Please select your state and district first.');
      return;
    }

    setSearchingLocation(true);
    setError('');

    try {
      const searchText = [
        query,
        selectedDistrict.districtName,
        selectedState.stateName,
        'India'
      ].join(', ');

      const params = new URLSearchParams({
        q: searchText,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'in'
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`
      );

      if (!response.ok) {
        throw new Error('Location search failed');
      }

      const results = await response.json();

      const normalize = (value) =>
        String(value || '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

      const stateName = normalize(selectedState.stateName);
      const districtName = normalize(selectedDistrict.districtName);

      const match = results.find((place) => {
        const address = place.address || {};
        const resultState = normalize(address.state);
        const resultDistrict = normalize(
          address.state_district || address.county
        );

        const stateMatches = resultState === stateName;

        const districtMatches =
          resultDistrict === districtName ||
          (districtName === 'sabarkantha' &&
            resultDistrict === 'sabarkantha');

        return stateMatches && districtMatches;
      });

      if (!match) {
        setError(
          'Could not verify this place within the selected district. ' +
          'Try a nearby village name or pincode.'
        );
        return;
      }

      const latitude = Number(match.lat);
      const longitude = Number(match.lon);

      if (!Number.isFinite(latitude) ||
          !Number.isFinite(longitude)) {
        throw new Error('Invalid location coordinates');
      }

      setFocusPosition({ latitude, longitude });

      // Search only navigates the map. Reset farm position and confirmation.
      setFarmPosition(null);
      setLocationSource(null);
      setLocationConfirmed(false);
    } catch (err) {
      console.error('Village location search error:', err);

      setError(
        'Location search is unavailable. Please try again ' +
        'or select your field manually on the map.'
      );
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleMapLocationChange = (
    position,
    source = 'FarmSelected'
  ) => {
    setFarmPosition(position);
    setLocationSource(source);
    setLocationConfirmed(false);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!farmPosition) {
      alert('Please select your actual farm location on the map.');
      return;
    }

    if (!locationConfirmed) {
      alert('Please confirm your farm location before creating the farm.');
      return;
    }

    if (!form.farmName.trim()) {
      setError('Please enter the farm name.');
      return;
    }

    if (!selectedState || !selectedDistrict) {
      setError('Please select a state and district.');
      return;
    }

    if (
      !Number.isFinite(farmPosition.latitude) ||
      !Number.isFinite(farmPosition.longitude)
    ) {
      setError('Please select your exact farm location on the map.');
      return;
    }

    if (!form.sowingDate) {
      setError('Please select the sowing or planting date.');
      return;
    }

    setSaving(true);

    try {
      await api.post('/farms', {
        farmName: form.farmName.trim(),
        cropType: form.cropType,
        sowingDate: form.sowingDate,

        state: selectedState.stateName,
        stateCode: selectedState.stateCode,

        district: selectedDistrict.districtName,
        districtCode: selectedDistrict.districtCode,

        latitude: farmPosition.latitude,
        longitude: farmPosition.longitude,

        locationSource: locationSource || 'FarmSelected'
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Create farm error:', err);

      setError(
        err.response?.data?.message ||
        'Could not create farm. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #c6d5c8',
    borderRadius: '6px',
    background: '#fff',
    boxSizing: 'border-box',
    font: 'inherit'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '7px',
    color: '#263b2e'
  };

  const fieldStyle = {
    marginBottom: '16px'
  };

  return (
    <main
      style={{
        maxWidth: '860px',
        margin: '12px auto 40px',
        padding: '0 16px'
      }}
    >
      <h2
        style={{
          marginBottom: '16px',
          fontSize: '20px',
          color: '#102719'
        }}
      >
        Create Farm
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: '22px',
          border: '1px solid #d9e4da',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <div style={fieldStyle}>
          <label htmlFor="farmName" style={labelStyle}>
            Farm Name
          </label>
          <input
            id="farmName"
            name="farmName"
            type="text"
            value={form.farmName}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="cropType" style={labelStyle}>
            Crop Selection
          </label>
          <select
            id="cropType"
            name="cropType"
            value={form.cropType}
            onChange={handleChange}
            required
            style={inputStyle}
          >
            <option value="Groundnut">Groundnut</option>
            <option value="Potato">Potato</option>
            <option value="Chilli">Chilli</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="sowingDate" style={labelStyle}>
            Sowing / Planting Date
          </label>
          <input
            id="sowingDate"
            name="sowingDate"
            type="date"
            value={form.sowingDate}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <small style={{ color: '#68796c' }}>
            Your recommended activity schedule is based on
            this date. Use a future date if you have not sown yet.
          </small>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="stateCode" style={labelStyle}>
            State / Union Territory *
          </label>
          <select
            id="stateCode"
            name="stateCode"
            value={form.stateCode}
            onChange={handleStateChange}
            required
            style={inputStyle}
          >
            <option value="">Select State / UT</option>
            {states.map((state) => (
              <option
                key={state.stateCode}
                value={state.stateCode}
              >
                {state.stateName}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="districtCode" style={labelStyle}>
            District *
          </label>
          <select
            id="districtCode"
            name="districtCode"
            value={form.districtCode}
            onChange={handleDistrictChange}
            disabled={!selectedState}
            required
            style={inputStyle}
          >
            <option value="">Select District</option>
            {districts.map((district) => (
              <option
                key={district.districtCode}
                value={district.districtCode}
              >
                {district.districtName}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>
            Farm Location *
          </label>

          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="locationQuery"
              style={labelStyle}
            >
              Village / Pincode / Nearby Landmark
            </label>

            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <input
                id="locationQuery"
                type="text"
                value={locationQuery}
                onChange={(event) =>
                  setLocationQuery(event.target.value)
                }
                placeholder="Enter village, pincode or landmark"
                style={{
                  ...inputStyle,
                  flex: '1 1 230px'
                }}
              />

              <button
                type="button"
                onClick={handleSearchLocation}
                disabled={searchingLocation || !selectedDistrict}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#287e32',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {searchingLocation ? 'Searching...' : 'Find Location'}
              </button>
            </div>

            <small style={{
              display: 'block',
              marginTop: '7px',
              color: '#68796c'
            }}>
              Search for a place near your farm. Then select
              your actual field on the map.
            </small>
          </div>

          <FarmLocationPicker
            position={farmPosition}
            focusPosition={focusPosition}
            districtName={selectedDistrict?.districtName || ''}
            onChange={handleMapLocationChange}
          />

          <div
            style={{
              marginTop: '16px',
              padding: '14px',
              border: '1px solid #d5e5d5',
              borderRadius: '10px',
              background: '#f8fcf8'
            }}
          >
            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>
              Confirm Farm Location
            </h4>

            {farmPosition ? (
              <>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Latitude:</strong>{' '}
                  {Number(farmPosition.latitude).toFixed(6)}
                </p>

                <p style={{ margin: '0 0 8px' }}>
                  <strong>Longitude:</strong>{' '}
                  {Number(farmPosition.longitude).toFixed(6)}
                </p>

                <p style={{ margin: '0 0 12px', fontSize: '13px' }}>
                  Please verify that this marker points to your actual
                  agricultural field, not just the village or district centre.
                </p>

                <button
                  type="button"
                  onClick={() => setLocationConfirmed(true)}
                  disabled={locationConfirmed}
                  style={{
                    padding: '10px 16px',
                    background: locationConfirmed ? '#e5f3e5' : '#2e7d32',
                    color: locationConfirmed ? '#21652a' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: locationConfirmed ? 'default' : 'pointer'
                  }}
                >
                  {locationConfirmed
                    ? '✓ Farm Location Confirmed'
                    : '✓ Confirm This Farm Location'}
                </button>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '13px' }}>
                Search for your village or use GPS, then select your actual
                farm on the map.
              </p>
            )}
          </div>

          {selectedDistrict && !focusPosition && (
            <small
              style={{
                display: 'block',
                marginTop: '8px',
                color: '#68796c'
              }}
            >
              District selected. Navigate to your farm on
              the map and click its exact location.
            </small>
          )}

          {farmPosition && (
            <small
              style={{
                display: 'block',
                marginTop: '8px',
                color: '#41754a'
              }}
            >
              Custom farm location selected.
            </small>
          )}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              color: '#b42318',
              background: '#fff1f0',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '14px',
              fontSize: '13px'
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !farmPosition || !locationConfirmed}
          style={{
            width: '100%',
            padding: '12px',
            background: (!farmPosition || !locationConfirmed) ? '#a3c2a8' : '#287e32',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: (saving || !farmPosition || !locationConfirmed) ? 'not-allowed' : 'pointer',
            opacity: (saving || !farmPosition || !locationConfirmed) ? 0.7 : 1
          }}
        >
          {saving ? 'Creating Farm...' : 'Create Farm'}
        </button>
      </form>
    </main>
  );
}