import puppeteer from 'puppeteer';
import { join } from 'path';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to http://localhost:5174/');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for "New York" popular location button...');
  await page.waitForSelector('button');
  
  const buttons = await page.$$('button');
  let clicked = false;
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text.trim() === 'New York') {
      console.log('Clicking "New York" button...');
      await button.click();
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    console.error('Could not find "New York" button');
    await browser.close();
    process.exit(1);
  }
  
  console.log('Waiting 5 seconds for Dashboard to render...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Taking screenshot...');
  const screenshotPath = join('C:\\Users\\hp\\.gemini\\antigravity\\brain\\bccb4036-8fa4-439c-b2e9-343781e0e58a', 'dashboard_screenshot.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);
  
  await browser.close();
})();
