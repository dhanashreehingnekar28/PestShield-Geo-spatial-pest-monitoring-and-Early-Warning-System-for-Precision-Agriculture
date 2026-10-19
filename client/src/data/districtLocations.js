
export const DISTRICT_LOCATIONS = {
  nashik: { latitude: 19.9975, longitude: 73.7898 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  ahmednagar: { latitude: 19.0948, longitude: 74.7480 },
  "ahilyanagar": { latitude: 19.0948, longitude: 74.7480 },
  satara: { latitude: 17.6805, longitude: 74.0183 },
  sangli: { latitude: 16.8524, longitude: 74.5815 },
  solapur: { latitude: 17.6599, longitude: 75.9064 },
  kolhapur: { latitude: 16.7050, longitude: 74.2433 },
  jalgaon: { latitude: 21.0077, longitude: 75.5626 },
  dhule: { latitude: 20.9042, longitude: 74.7749 },
  nagpur: { latitude: 21.1458, longitude: 79.0882 },
  amravati: { latitude: 20.9320, longitude: 77.7523 },
  akola: { latitude: 20.7002, longitude: 77.0082 },
  latur: { latitude: 18.4088, longitude: 76.5604 },
  nanded: { latitude: 19.1383, longitude: 77.3210 },
  beed: { latitude: 18.9891, longitude: 75.7601 },
  "chhatrapati sambhajinagar": {
    latitude: 19.8762,
    longitude: 75.3433
  },
  aurangabad: { latitude: 19.8762, longitude: 75.3433 },
  mumbai: { latitude: 19.0760, longitude: 72.8777 },
  thane: { latitude: 19.2183, longitude: 72.9781 },
  palghar: { latitude: 19.6967, longitude: 72.7699 },
  raigad: { latitude: 18.5158, longitude: 73.1822 },
  ratnagiri: { latitude: 16.9902, longitude: 73.3120 },
  sindhudurg: { latitude: 16.3492, longitude: 73.5594 }
};

export function findDistrictLocation(name) {
  const key = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  return DISTRICT_LOCATIONS[key] || null;
}
