
const express = require('express');
const router = express.Router();

const Farm = require('../models/Farm');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/weather/farm/:farmId
// Admin can view any farm; farmers can view only their own farms.
router.get(
  '/farm/:farmId',
  protect,
  asyncHandler(async (req, res) => {
    const { farmId } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(farmId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farm ID'
      });
    }

    const farm = await Farm.findById(farmId)
      .select('farmer farmName cropType location')
      .lean();

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const isOwner =
      String(farm.farmer) === String(req.user._id);

    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this farm'
      });
    }

    const latitude = farm.location?.latitude;
    const longitude = farm.location?.longitude;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Farm has invalid coordinates'
      });
    }

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'wind_speed_10m',
        'weather_code'
      ].join(','),
      timezone: 'auto'
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;

    try {
      response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params}`,
        { signal: controller.signal }
      );
    } catch (error) {
      return res.status(502).json({
        success: false,
        message: 'Weather service is temporarily unavailable'
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: 'Weather provider returned an error'
      });
    }

    const weatherData = await response.json();
    const current = weatherData.current;

    if (!current) {
      return res.status(502).json({
        success: false,
        message: 'Weather information is unavailable'
      });
    }

    return res.json({
      success: true,
      data: {
        farmId: String(farm._id),
        farmName: farm.farmName,
        cropType: farm.cropType,
        locationSource: farm.location.source || 'Unknown',
        coordinates: {
          latitude,
          longitude
        },
        weather: {
          temperature: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          precipitation: current.precipitation,
          windSpeed: current.wind_speed_10m,
          weatherCode: current.weather_code,
          observedAt: current.time,
          timezone: weatherData.timezone,
          units: weatherData.current_units
        },
        provider: 'Open-Meteo'
      }
    });
  })
);

module.exports = router;
