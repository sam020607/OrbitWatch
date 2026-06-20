/**
 * Mock Asteroids Database
 * Standard Near-Earth Asteroids (NEAs) & Potentially Hazardous Asteroids (PHAs)
 * All timestamps are generated dynamically relative to Date.now() so close approaches are always active.
 */

export function getMockAsteroids() {
  const now = Date.now();

  const mockList = [
    {
      id: '99942',
      name: 'Apophis (99942)',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=99942',
      absolute_magnitude: 19.7,
      is_potentially_hazardous: true,
      diameter_min: 340,
      diameter_max: 370,
      velocity_kms: 7.42,
      miss_distance_km: 1120000,
      miss_distance_ld: 2.91,
      close_approach_timestamp: now + 1.2 * 3600 * 1000, // Approaching in 1.2 hours
      ra: 10.2,
      dec: 15.4,
    },
    {
      id: '101955',
      name: 'Bennu (101955)',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=101955',
      absolute_magnitude: 20.9,
      is_potentially_hazardous: true,
      diameter_min: 490,
      diameter_max: 510,
      velocity_kms: 6.28,
      miss_distance_km: 3200000,
      miss_distance_ld: 8.32,
      close_approach_timestamp: now - 2.5 * 3600 * 1000, // Passed 2.5 hours ago
      ra: 5.6,
      dec: -12.3,
    },
    {
      id: '433',
      name: 'Eros (433)',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=433',
      absolute_magnitude: 11.2,
      is_potentially_hazardous: false,
      diameter_min: 16800,
      diameter_max: 17200,
      velocity_kms: 21.87,
      miss_distance_km: 18400000,
      miss_distance_ld: 47.8,
      close_approach_timestamp: now + 15 * 3600 * 1000, // Approaching in 15 hours
      ra: 18.4,
      dec: -45.6,
    },
    {
      id: '4179',
      name: 'Toutatis (4179)',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=4179',
      absolute_magnitude: 15.3,
      is_potentially_hazardous: true,
      diameter_min: 2450,
      diameter_max: 2600,
      velocity_kms: 11.02,
      miss_distance_km: 7200000,
      miss_distance_ld: 18.7,
      close_approach_timestamp: now + 32 * 3600 * 1000, // Approaching in 32 hours
      ra: 22.1,
      dec: 8.9,
    },
    {
      id: '2026LH1',
      name: '2026 LH1',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2026LH1',
      absolute_magnitude: 23.4,
      is_potentially_hazardous: true,
      diameter_min: 65,
      diameter_max: 145,
      velocity_kms: 15.48,
      miss_distance_km: 980000,
      miss_distance_ld: 2.55,
      close_approach_timestamp: now + 4.5 * 3600 * 1000, // Approaching in 4.5 hours
      ra: 12.8,
      dec: 38.2,
    },
    {
      id: '2026KP2',
      name: '2026 KP2',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2026KP2',
      absolute_magnitude: 27.1,
      is_potentially_hazardous: false,
      diameter_min: 8,
      diameter_max: 18,
      velocity_kms: 8.12,
      miss_distance_km: 290000,
      miss_distance_ld: 0.75, // Inside Lunar Orbit!
      close_approach_timestamp: now + 0.3 * 3600 * 1000, // Approaching in 18 minutes!
      ra: 15.1,
      dec: -5.4,
    },
    {
      id: '2026QX9',
      name: '2026 QX9',
      nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2026QX9',
      absolute_magnitude: 21.1,
      is_potentially_hazardous: true,
      diameter_min: 210,
      diameter_max: 470,
      velocity_kms: 23.14,
      miss_distance_km: 4300000,
      miss_distance_ld: 11.18,
      close_approach_timestamp: now - 8.2 * 3600 * 1000, // Passed 8.2 hours ago
      ra: 2.3,
      dec: 56.1,
    }
  ];

  // Sort by miss distance (closest first)
  return mockList.sort((a, b) => a.miss_distance_km - b.miss_distance_km);
}
