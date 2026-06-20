import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to http://localhost:5174/');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for popular location buttons...');
  await page.waitForSelector('button');
  
  // Click on "Tokyo" quick select location
  const buttons = await page.$$('button');
  let locationClicked = false;
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text.trim() === 'Tokyo') {
      await button.click();
      locationClicked = true;
      break;
    }
  }
  
  if (!locationClicked) {
    console.error('Could not find Tokyo button');
    await browser.close();
    process.exit(1);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Inspecting left nav rail (aside element)...');
  const styles = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return null;
    const computed = window.getComputedStyle(aside);
    return {
      className: aside.className,
      backgroundColor: computed.backgroundColor,
      backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
      opacity: computed.opacity,
      display: computed.display,
      width: computed.width
    };
  });
  
  console.log('Nav Rail Styles:', styles);
  
  await browser.close();
})();
