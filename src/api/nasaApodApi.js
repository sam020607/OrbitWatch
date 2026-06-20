import axios from 'axios';

const NASA_APOD_API_URL = 'https://api.nasa.gov/planetary/apod';

/**
 * Fetch NASA's Astronomy Picture of the Day.
 * Falls back to a local mock if the API fails or is rate-limited.
 */
export async function fetchAstronomyPictureOfTheDay() {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Try loading from localStorage first to conserve rate limits
  try {
    const cached = localStorage.getItem('orbitwatch_apod_data');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.date === todayStr && parsed.explanation) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[NASA APOD API] Failed to read from localStorage:', e);
  }

  try {
    const key = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
    const maskedKey = key === 'DEMO_KEY' ? 'DEMO_KEY' : `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
    console.log(`[NASA APOD API] Fetching cosmic capture from: ${NASA_APOD_API_URL}?api_key=${maskedKey}`);

    const response = await axios.get(NASA_APOD_API_URL, {
      params: {
        api_key: key,
      },
      timeout: 20000,
    });
    
    const data = response.data;
    if (data && data.url) {
      try {
        localStorage.setItem('orbitwatch_apod_data', JSON.stringify(data));
      } catch (e) {
        console.warn('[NASA APOD API] Failed to write to localStorage:', e);
      }
    }
    return data;
  } catch (error) {
    console.warn('[NASA APOD API] Fetch failed. Using fallback APOD data:', error.message);
    return {
      title: "Pillars of Creation",
      url: "https://images-assets.nasa.gov/image/PIA18919/PIA18919~orig.jpg",
      explanation: "This composite image combines data from Hubble and the James Webb Space Telescope to reveal the famous Pillars of Creation in stellar detail. The towering structures are columns of cool interstellar gas and dust, reflecting light from a cluster of nearby hot, young stars.",
      date: todayStr,
      copyright: "NASA, ESA, CSA, STScI"
    };
  }
}
