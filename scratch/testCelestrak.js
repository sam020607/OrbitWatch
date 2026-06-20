import axios from 'axios';

async function test() {
  const satId = 25544;
  const urls = [
    `https://celestrak.org/NORAD/elements/gp.php?CATNR=${satId}&FORMAT=TLE`,
    `https://corsproxy.io/?${encodeURIComponent(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${satId}&FORMAT=TLE`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${satId}&FORMAT=TLE`)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${satId}&FORMAT=TLE`)}`
  ];

  for (const url of urls) {
    console.log('Testing URL:', url);
    try {
      const res = await axios.get(url, { timeout: 5000 });
      console.log('Success! Status:', res.status);
      console.log('Data sample (first 100 chars):', typeof res.data === 'string' ? res.data.substring(0, 100) : JSON.stringify(res.data).substring(0, 100));
    } catch (err) {
      console.log('Failed:', err.message);
    }
    console.log('--------------------------------------------------');
  }
}

test();
