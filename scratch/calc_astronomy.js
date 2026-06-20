import SunCalc from 'suncalc';

// Local time: 2026-06-19T16:37:26+05:30
// UTC time: 2026-06-19T11:07:26Z
const date = new Date('2026-06-19T11:07:26Z');

// Indian coordinates (e.g. New Delhi: 28.6139, 77.2090)
const lat = 28.6139;
const lon = 77.2090;

const sunPos = SunCalc.getPosition(date, lat, lon);
const moonPos = SunCalc.getMoonPosition(date, lat, lon);

const sunAltDeg = sunPos.altitude * 180 / Math.PI;
const moonAltDeg = moonPos.altitude * 180 / Math.PI;

console.log('--- Astronomy Calculations for New Delhi, India ---');
console.log('Timestamp:', date.toString());
console.log('Sun Elevation (Altitude):', sunAltDeg.toFixed(2) + '°');
console.log('Moon Elevation (Altitude):', moonAltDeg.toFixed(2) + '°');
console.log('Is Sun above horizon?', sunAltDeg > 0);
console.log('Is Moon above horizon?', moonAltDeg > 0);
console.log('----------------------------------------------------');
