import puppeteer from 'puppeteer';
import { join } from 'path';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to http://localhost:4173/');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for popular location buttons...');
  await page.waitForSelector('button');
  
  // Click on "Tokyo" quick select location
  const buttons = await page.$$('button');
  let locationClicked = false;
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text.trim() === 'Tokyo') {
      console.log('Clicking "Tokyo" quick select...');
      await button.click();
      locationClicked = true;
      break;
    }
  }
  
  if (!locationClicked) {
    console.error('Could not find "Tokyo" quick select button');
    await browser.close();
    process.exit(1);
  }
  
  console.log('Waiting for Dashboard to load...');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Looking for "View on Globe" button...');
  const dashboardButtons = await page.$$('button');
  let globeClicked = false;
  for (const button of dashboardButtons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text.includes('View on Globe')) {
      console.log('Clicking "View on Globe" button...');
      await button.click();
      globeClicked = true;
      break;
    }
  }
  
  if (!globeClicked) {
    console.error('Could not find "View on Globe" button on Dashboard');
    await browser.close();
    process.exit(1);
  }
  
  console.log('Waiting 5 seconds for 3D Globe to load and render...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('Opening right panel...');
  const expandButton = await page.$('button[title="Expand Sidebar Info"]');
  if (expandButton) {
    await expandButton.click();
    console.log('Right panel expanded. Waiting 1 second...');
    await new Promise(r => setTimeout(r, 1000));
  } else {
    console.warn('Could not find right panel expand handle');
  }
  
  console.log('Taking screenshot...');
  const screenshotPath = join('C:\\Users\\hp\\.gemini\\antigravity\\brain\\bccb4036-8fa4-439c-b2e9-343781e0e58a', 'globe_3d_screenshot.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);
  
  await browser.close();
})();
