import axios from 'axios';

const NASA_APOD_API_URL = 'https://api.nasa.gov/planetary/apod';

/**
 * Fetch NASA's Astronomy Picture of the Day.
 * Falls back to a local mock if the API fails or is rate-limited.
 */
export async function fetchAstronomyPictureOfTheDay() {
  try {
    const response = await axios.get(NASA_APOD_API_URL, {
      params: {
        api_key: 'DEMO_KEY',
      },
      timeout: 8000,
    });
    return response.data;
  } catch (error) {
    console.warn('[NASA APOD API] Fetch failed. Using fallback APOD data:', error.message);
    return {
      title: "Pillars of Creation",
      url: "https://images-assets.nasa.gov/image/PIA18919/PIA18919~orig.jpg",
      explanation: "This composite image combines data from Hubble and the James Webb Space Telescope to reveal the famous Pillars of Creation in stellar detail. The towering structures are columns of cool interstellar gas and dust, reflecting light from a cluster of nearby hot, young stars.",
      date: new Date().toISOString().split('T')[0],
      copyright: "NASA, ESA, CSA, STScI"
    };
  }
}
