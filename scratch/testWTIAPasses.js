import axios from 'axios';

async function test() {
  const lat = 51.5074;
  const lon = -0.1278;
  const url = `https://api.wheretheiss.at/v1/satellites/25544/passes?latitude=${lat}&longitude=${lon}`;
  console.log('Testing wheretheiss.at passes URL:', url);
  try {
    const res = await axios.get(url, { timeout: 15000 });
    console.log('Success! Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('Failed:', err.message);
    if (err.response) {
      console.log('Response status:', err.response.status);
      console.log('Response data:', err.response.data);
    }
  }
}

test();
