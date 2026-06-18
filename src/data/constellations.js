export const CONSTELLATIONS = [
  { id: 'ori', name: 'Orion', ra: 5.6, dec: 0.0, abbr: 'Ori', description: 'The Hunter - one of the most recognizable constellations in the night sky, featuring the famous Orion\'s Belt.' },
  { id: 'uma', name: 'Ursa Major', ra: 11.3, dec: 55.0, abbr: 'UMa', description: 'The Great Bear - contains the Big Dipper asterism, used to find Polaris (the North Star).' },
  { id: 'umi', name: 'Ursa Minor', ra: 15.0, dec: 75.0, abbr: 'UMi', description: 'The Little Bear - contains the Little Dipper and the North Star, Polaris, at its tail.' },
  { id: 'cas', name: 'Cassiopeia', ra: 1.0, dec: 60.0, abbr: 'Cas', description: 'The Queen - a distinct "W" or "M" shaped constellation in the northern sky.' },
  { id: 'cyg', name: 'Cygnus', ra: 20.6, dec: 42.0, abbr: 'Cyg', description: 'The Swan - also known as the Northern Cross, flying along the Milky Way.' },
  { id: 'leo', name: 'Leo', ra: 10.5, dec: 15.0, abbr: 'Leo', description: 'The Lion - a prominent spring constellation containing the bright star Regulus.' },
  { id: 'sco', name: 'Scorpius', ra: 16.8, dec: -26.0, abbr: 'Sco', description: 'The Scorpion - a southern summer constellation containing the red supergiant Antares.' },
  { id: 'tau', name: 'Taurus', ra: 4.6, dec: 15.0, abbr: 'Tau', description: 'The Bull - contains the bright red star Aldebaran and the Pleiades star cluster.' },
  { id: 'gem', name: 'Gemini', ra: 7.0, dec: 22.0, abbr: 'Gem', description: 'The Twins - features the twin bright stars Castor and Pollux.' },
  { id: 'peg', name: 'Pegasus', ra: 23.0, dec: 20.0, abbr: 'Peg', description: 'The Winged Horse - contains the Great Square of Pegasus.' },
  { id: 'and', name: 'Andromeda', ra: 0.8, dec: 40.0, abbr: 'And', description: 'The Chained Maiden - home to the Andromeda Galaxy (M31), the closest spiral galaxy to us.' },
  { id: 'cma', name: 'Canis Major', ra: 6.8, dec: -22.0, abbr: 'CMa', description: 'The Greater Dog - contains Sirius, the brightest star in the entire night sky.' },
  { id: 'sgr', name: 'Sagittarius', ra: 19.0, dec: -25.0, abbr: 'Sgr', description: 'The Archer - contains the Teapot asterism, pointing toward the center of the Milky Way.' },
  { id: 'cru', name: 'Crux', ra: 12.5, dec: -60.0, abbr: 'Cru', description: 'The Southern Cross - the smallest and most famous southern hemisphere constellation.' },
  { id: 'cen', name: 'Centaurus', ra: 13.0, dec: -47.0, abbr: 'Cen', description: 'The Centaur - contains Alpha Centauri, the closest star system to our Sun.' },
  { id: 'aql', name: 'Aquila', ra: 19.8, dec: 3.0, abbr: 'Aql', description: 'The Eagle - features the bright star Altair, part of the Summer Triangle.' },
  { id: 'lyr', name: 'Lyra', ra: 18.6, dec: 38.0, abbr: 'Lyr', description: 'The Lyre - contains Vega, the fifth-brightest star in the sky.' },
  { id: 'her', name: 'Hercules', ra: 17.2, dec: 27.0, abbr: 'Her', description: 'The Hero - features the Keystone asterism and the Great Hercules Cluster (M13).' },
  { id: 'per', name: 'Perseus', ra: 3.5, dec: 45.0, abbr: 'Per', description: 'The Hero - associated with the Perseid meteor shower.' },
  { id: 'boo', name: 'Bootes', ra: 14.8, dec: 30.0, abbr: 'Boo', description: 'The Herdsman - contains Arcturus, the brightest star in the northern celestial hemisphere.' },
  { id: 'vir', name: 'Virgo', ra: 13.4, dec: -4.0, abbr: 'Vir', description: 'The Virgin - contains the bright star Spica and a massive cluster of galaxies.' },
  { id: 'ari', name: 'Aries', ra: 2.6, dec: 20.0, abbr: 'Ari', description: 'The Ram - historically the first sign of the zodiac.' },
  { id: 'cnc', name: 'Cancer', ra: 8.7, dec: 20.0, abbr: 'Cnc', description: 'The Crab - contains the Beehive Cluster (M44), visible to the naked eye.' },
  { id: 'lib', name: 'Libra', ra: 15.2, dec: -15.0, abbr: 'Lib', description: 'The Scales - representing justice and balance.' },
  { id: 'cap', name: 'Capricornus', ra: 21.0, dec: -20.0, abbr: 'Cap', description: 'The Sea Goat - one of the oldest recognized constellations.' },
  { id: 'aqr', name: 'Aquarius', ra: 22.3, dec: -10.0, abbr: 'Aqr', description: 'The Water Bearer - source of the Eta Aquariids meteor shower.' },
  { id: 'psc', name: 'Pisces', ra: 0.8, dec: 15.0, abbr: 'Psc', description: 'The Fishes - representing two tied fish in Greek mythology.' }
];

// Calculate Greenwich Mean Sidereal Time in degrees
export function getGMST(timestampMs) {
  const J2000 = 946728000000; // Jan 1, 2000 12:00:00 UTC in ms
  const d = (timestampMs - J2000) / 86400000; // days since J2000.0
  let gmst = 280.46061837 + 360.98564736629 * d;
  gmst = gmst % 360;
  if (gmst < 0) gmst += 360;
  return gmst;
}

// Convert RA/Dec to local Azimuth & Elevation
export function getLocalCoordinates(ra, dec, lat, lon, timestampMs = Date.now()) {
  const gmst = getGMST(timestampMs);
  const lst = (gmst + lon) % 360;
  
  const raDeg = ra * 15;
  let ha = lst - raDeg;
  ha = ha % 360;
  if (ha > 180) ha -= 360;
  if (ha < -180) ha += 360;
  
  const latRad = (lat * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const haRad = (ha * Math.PI) / 180;
  
  // Elevation
  const sinEl = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const elRad = Math.asin(sinEl);
  const el = (elRad * 180) / Math.PI;
  
  // Azimuth
  const y = -Math.sin(haRad) * Math.cos(decRad);
  const x = Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(haRad);
  let azRad = Math.atan2(y, x);
  let az = (azRad * 180) / Math.PI;
  if (az < 0) az += 360;
  
  return { az, el };
}

// Calculate the sub-stellar point (latitude/longitude where the constellation is directly overhead)
export function getSubStellarPoint(ra, dec, timestampMs = Date.now()) {
  const gmst = getGMST(timestampMs);
  const raDeg = ra * 15;
  
  const lat = dec;
  let lon = raDeg - gmst;
  lon = lon % 360;
  if (lon > 180) lon -= 360;
  if (lon < -180) lon += 360;
  
  return { lat, lon };
}
