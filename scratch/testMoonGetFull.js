import axios from 'axios';

const APP_ID = 'b0b49c32-0c72-42fc-8a7e-7e211b83026c';
const APP_SECRET = '0dc71ce4780a297ae6026caeea66ccbda9d33e4baf62229efb493e7a24250a0a52bcc495693e1d93fe8d68553f8f887ef03c03d6d472db28c03dc7867da988ad93c0463880e266f1116e13eb6a0fcb573b1296bf84ed059582cc6befe2b214d77edf9167f545342b80ee88987646df65';
const BASE_URL = 'https://api.astronomyapi.com/api/v2';

const credentials = btoa(`${APP_ID}:${APP_SECRET}`);

async function testGet() {
  const url = `${BASE_URL}/moon/phase`;
  console.log('Testing GET:', url);
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${credentials}` },
      params: { 
        latitude: -23.5505, 
        longitude: -46.6333, 
        format: 'png', 
        style: JSON.stringify({ moonStyle: 'default', backgroundStyle: 'stars', backgroundColor: '#0d1b2a', headingColor: '#e2e8f0', textColor: '#94a3b8' }), 
        observer: JSON.stringify({ date: '2026-06-15' }) 
      },
      timeout: 10000
    });
    console.log('GET Response status:', response.status);
  } catch (error) {
    console.log('GET failed.');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('Request was made but no response was received:', error.request);
    } else {
      console.log('Error setting up request:', error.message);
    }
  }
}

testGet();
