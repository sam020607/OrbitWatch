import axios from 'axios';

const N2YO_API_KEY = 'GD58AN-S8Y2XZ-NRVRCE-5RYG';
const BASE_URL = 'https://api.n2yo.com/rest/v1/satellite';

async function test() {
  const satId = 25544; // ISS
  const lat = -23.5505; // Sao Paulo Lat
  const lon = -46.6333; // Sao Paulo Lon
  const alt = 0;
  const days = 10;
  const minElevation = 10;
  
  const url = `${BASE_URL}/radiopasses/${satId}/${lat}/${lon}/${alt}/${days}/${minElevation}/&apiKey=${N2YO_API_KEY}`;
  
  console.log('Fetching:', url);
  try {
    const response = await axios.get(url);
    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data || {}));
    if (response.data && response.data.passes) {
      console.log('Found passes count:', response.data.passes.length);
      console.log('First pass sample:', JSON.stringify(response.data.passes[0], null, 2));
    } else {
      console.log('No passes found in response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Fetch failed:', error.message);
  }
}

test();
