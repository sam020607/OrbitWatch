import axios from 'axios';

const APP_ID = 'b0b49c32-0c72-42fc-8a7e-7e211b83026c';
const APP_SECRET = '0dc71ce4780a297ae6026caeea66ccbda9d33e4baf62229efb493e7a24250a0a52bcc495693e1d93fe8d68553f8f887ef03c03d6d472db28c03dc7867da988ad93c0463880e266f1116e13eb6a0fcb573b1296bf84ed059582cc6befe2b214d77edf9167f545342b80ee88987646df65';
const BASE_URL = 'https://api.astronomyapi.com/api/v2';

const credentials = btoa(`${APP_ID}:${APP_SECRET}`);

async function testBodies() {
  const url = `${BASE_URL}/bodies/positions`;
  console.log('Testing GET:', url);
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${credentials}` },
      params: {
        latitude: -23.5505,
        longitude: -46.6333,
        elevation: 0,
        from_date: '2026-06-15',
        to_date: '2026-06-15',
        time: '21:00:00'
      },
      timeout: 10000
    });
    console.log('GET Response status:', response.status);
    console.log('GET Response data keys:', Object.keys(response.data || {}));
    if (response.data && response.data.data && response.data.data.table) {
      console.log('Found table rows count:', response.data.data.table.rows.length);
    }
  } catch (error) {
    console.log('GET failed.');
    console.log('Error message:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testBodies();
