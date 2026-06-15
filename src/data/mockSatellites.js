/**
 * Mock satellite data — 15 realistic tracked satellites.
 * Structure mirrors N2YO API response for easy live swap-in.
 * 
 * Fields:
 *   satid     — NORAD catalog number
 *   satname   — Common name
 *   intDesignator — International designator
 *   launchDate — Launch date
 *   satlat    — Current latitude (will be offset relative to observer)
 *   satlon    — Current longitude
 *   satalt    — Altitude in km
 *   velocity  — Velocity in km/s
 *   type      — Category: 'space-station', 'weather', 'gps', 'comms', 'earth-obs', 'debris'
 *   _latOffset — Used internally to position relative to observer
 *   _lonOffset — Used internally to position relative to observer
 */

export const MOCK_SATELLITES = [
  {
    satid: 25544,
    satname: 'ISS (ZARYA)',
    intDesignator: '1998-067A',
    launchDate: '1998-11-20',
    satlat: 0, satlon: 0, satalt: 408.4,
    velocity: 7.66,
    type: 'space-station',
    _latOffset: 2.3, _lonOffset: -5.1,
  },
  {
    satid: 48274,
    satname: 'CSS (TIANHE)',
    intDesignator: '2021-035A',
    launchDate: '2021-04-29',
    satlat: 0, satlon: 0, satalt: 389.2,
    velocity: 7.68,
    type: 'space-station',
    _latOffset: -3.8, _lonOffset: 8.4,
  },
  {
    satid: 33591,
    satname: 'NOAA 19',
    intDesignator: '2009-005A',
    launchDate: '2009-02-06',
    satlat: 0, satlon: 0, satalt: 870.2,
    velocity: 7.44,
    type: 'weather',
    _latOffset: 15.2, _lonOffset: -12.7,
  },
  {
    satid: 25338,
    satname: 'NOAA 15',
    intDesignator: '1998-030A',
    launchDate: '1998-05-13',
    satlat: 0, satlon: 0, satalt: 813.6,
    velocity: 7.47,
    type: 'weather',
    _latOffset: -20.1, _lonOffset: 22.3,
  },
  {
    satid: 44387,
    satname: 'STARLINK-1007',
    intDesignator: '2019-074A',
    launchDate: '2019-11-11',
    satlat: 0, satlon: 0, satalt: 550.3,
    velocity: 7.59,
    type: 'comms',
    _latOffset: 5.7, _lonOffset: 15.2,
  },
  {
    satid: 44390,
    satname: 'STARLINK-1008',
    intDesignator: '2019-074D',
    launchDate: '2019-11-11',
    satlat: 0, satlon: 0, satalt: 549.8,
    velocity: 7.59,
    type: 'comms',
    _latOffset: -8.2, _lonOffset: -18.5,
  },
  {
    satid: 44394,
    satname: 'STARLINK-1009',
    intDesignator: '2019-074H',
    launchDate: '2019-11-11',
    satlat: 0, satlon: 0, satalt: 551.1,
    velocity: 7.59,
    type: 'comms',
    _latOffset: 12.4, _lonOffset: 7.8,
  },
  {
    satid: 36516,
    satname: 'GPS BIIR-17 (PRN 11)',
    intDesignator: '2010-007A',
    launchDate: '2010-03-06',
    satlat: 0, satlon: 0, satalt: 20180.1,
    velocity: 3.87,
    type: 'gps',
    _latOffset: -45.3, _lonOffset: 30.1,
  },
  {
    satid: 38833,
    satname: 'GPS BIIF-3 (PRN 24)',
    intDesignator: '2012-053A',
    launchDate: '2012-10-04',
    satlat: 0, satlon: 0, satalt: 20195.7,
    velocity: 3.87,
    type: 'gps',
    _latOffset: 38.9, _lonOffset: -42.6,
  },
  {
    satid: 39533,
    satname: 'TERRA DEM-1',
    intDesignator: '2013-066A',
    launchDate: '2013-11-21',
    satlat: 0, satlon: 0, satalt: 506.3,
    velocity: 7.61,
    type: 'earth-obs',
    _latOffset: -12.7, _lonOffset: 25.4,
  },
  {
    satid: 27386,
    satname: 'AQUA',
    intDesignator: '2002-022A',
    launchDate: '2002-05-04',
    satlat: 0, satlon: 0, satalt: 705.6,
    velocity: 7.50,
    type: 'earth-obs',
    _latOffset: 25.1, _lonOffset: -35.8,
  },
  {
    satid: 25994,
    satname: 'TERRA',
    intDesignator: '1999-068A',
    launchDate: '1999-12-18',
    satlat: 0, satlon: 0, satalt: 706.1,
    velocity: 7.50,
    type: 'earth-obs',
    _latOffset: -30.4, _lonOffset: 18.9,
  },
  {
    satid: 46826,
    satname: 'ONEWEB-0178',
    intDesignator: '2021-015A',
    launchDate: '2021-03-25',
    satlat: 0, satlon: 0, satalt: 1200.4,
    velocity: 7.25,
    type: 'comms',
    _latOffset: 8.3, _lonOffset: -28.1,
  },
  {
    satid: 43566,
    satname: 'FENGYUN 3D',
    intDesignator: '2017-072A',
    launchDate: '2017-11-15',
    satlat: 0, satlon: 0, satalt: 836.5,
    velocity: 7.45,
    type: 'weather',
    _latOffset: -18.6, _lonOffset: 41.2,
  },
  {
    satid: 40069,
    satname: 'SJ-11-09',
    intDesignator: '2014-066A',
    launchDate: '2014-10-27',
    satlat: 0, satlon: 0, satalt: 487.3,
    velocity: 7.63,
    type: 'debris',
    _latOffset: 33.1, _lonOffset: -7.5,
  },
  {
    satid: 37820,
    satname: 'SES-3',
    intDesignator: '2011-035A',
    launchDate: '2011-07-15',
    satlat: 0, satlon: 0, satalt: 35786.2,
    velocity: 3.07,
    type: 'tv',
    _latOffset: 0.1, _lonOffset: -15.5,
  },
  {
    satid: 40982,
    satname: 'EUTELSAT 8 WEST B',
    intDesignator: '2015-039B',
    launchDate: '2015-08-20',
    satlat: 0, satlon: 0, satalt: 35792.4,
    velocity: 3.07,
    type: 'tv',
    _latOffset: -0.2, _lonOffset: 24.3,
  },
];

/**
 * Mock 24-hour pass predictions for ISS (NORAD ID: 25544)
 * and a sample Starlink (44387).
 * 
 * Each pass object matches N2YO API response structure:
 *   startAz     — Azimuth at AOS (degrees)
 *   startAzCompass — Cardinal direction at AOS
 *   startEl     — Elevation at AOS (degrees)
 *   startUTC    — Unix timestamp of AOS
 *   maxAz       — Azimuth at max elevation
 *   maxAzCompass — Cardinal at max elevation
 *   maxEl       — Max elevation (degrees)
 *   maxUTC      — Timestamp of max elevation
 *   endAz       — Azimuth at LOS
 *   endAzCompass — Cardinal direction at LOS
 *   endEl       — Elevation at LOS
 *   endUTC      — Unix timestamp of LOS
 *   mag         — Magnitude (brightness, -ve = brighter)
 *   duration    — Duration in seconds
 */

const BASE_TIME = 1700000000; // will be shifted to now+15min in n2yoApi.js

export const MOCK_PASSES = {
  25544: [ // ISS passes
    {
      startAz: 312, startAzCompass: 'NW', startEl: 10,
      startUTC: BASE_TIME,
      maxAz: 47,  maxAzCompass: 'NE', maxEl: 67,
      maxUTC: BASE_TIME + 290,
      endAz: 125, endAzCompass: 'SE', endEl: 10,
      endUTC: BASE_TIME + 580,
      mag: -3.4, duration: 580,
    },
    {
      startAz: 270, startAzCompass: 'W',  startEl: 10,
      startUTC: BASE_TIME + 5700,
      maxAz: 180, maxAzCompass: 'S',  maxEl: 32,
      maxUTC: BASE_TIME + 5700 + 220,
      endAz: 90,  endAzCompass: 'E',  endEl: 10,
      endUTC: BASE_TIME + 5700 + 440,
      mag: -1.8, duration: 440,
    },
    {
      startAz: 338, startAzCompass: 'NNW', startEl: 10,
      startUTC: BASE_TIME + 11400,
      maxAz: 270, maxAzCompass: 'W',  maxEl: 18,
      maxUTC: BASE_TIME + 11400 + 180,
      endAz: 202, endAzCompass: 'SSW', endEl: 10,
      endUTC: BASE_TIME + 11400 + 360,
      mag: -0.9, duration: 360,
    },
    {
      startAz: 22,  startAzCompass: 'NNE', startEl: 10,
      startUTC: BASE_TIME + 17100,
      maxAz: 90,  maxAzCompass: 'E',  maxEl: 45,
      maxUTC: BASE_TIME + 17100 + 250,
      endAz: 158, endAzCompass: 'SSE', endEl: 10,
      endUTC: BASE_TIME + 17100 + 500,
      mag: -2.6, duration: 500,
    },
  ],

  44387: [ // Starlink-1007 passes
    {
      startAz: 285, startAzCompass: 'WNW', startEl: 10,
      startUTC: BASE_TIME + 1800,
      maxAz: 355, maxAzCompass: 'N',  maxEl: 24,
      maxUTC: BASE_TIME + 1800 + 190,
      endAz: 65,  endAzCompass: 'ENE', endEl: 10,
      endUTC: BASE_TIME + 1800 + 380,
      mag: 2.1, duration: 380,
    },
    {
      startAz: 105, startAzCompass: 'ESE', startEl: 10,
      startUTC: BASE_TIME + 7200,
      maxAz: 175, maxAzCompass: 'S',  maxEl: 51,
      maxUTC: BASE_TIME + 7200 + 260,
      endAz: 245, endAzCompass: 'WSW', endEl: 10,
      endUTC: BASE_TIME + 7200 + 520,
      mag: 1.4, duration: 520,
    },
  ],
};

/**
 * Mock meteor shower data for the current month
 */
export const MOCK_METEOR_SHOWERS = [
  {
    name: 'Perseid Meteor Shower',
    active: false,
    peak: 'August 12-13',
    rate: 100,
    radiantAz: 45,
    radiantEl: 60,
    description: 'One of the best annual showers. Parent comet: 109P/Swift-Tuttle.',
  },
  {
    name: 'Geminid Meteor Shower',
    active: true,
    peak: 'December 13-14',
    rate: 120,
    radiantAz: 112,
    radiantEl: 72,
    description: 'Richest annual shower. Parent body: 3200 Phaethon (asteroid).',
  },
];

/**
 * Satellite type display config
 */
export const SAT_TYPE_CONFIG = {
  'space-station': { label: 'Station', color: '#00d4ff', badgeClass: 'badge-cyan' },
  'weather':       { label: 'Weather', color: '#10b981', badgeClass: 'badge-green' },
  'gps':           { label: 'GPS', badgeClass: 'badge-amber', color: '#f59e0b' },
  'comms':         { label: 'Comms',   color: '#a78bfa', badgeClass: 'badge-amber' },
  'tv':            { label: 'TV Sat',  color: '#ec4899', badgeClass: 'badge-pink' },
  'earth-obs':     { label: 'EO Sat',  color: '#f59e0b', badgeClass: 'badge-amber' },
  'debris':        { label: 'Debris',  color: '#ef4444', badgeClass: 'badge-red' },
};
