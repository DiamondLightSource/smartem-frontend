const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
    slowMo: 100
  });

  const page = await browser.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    console.log(`CONSOLE [${msg.type()}]:`, text);
  });

  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log('PAGE ERROR:', error.message);
  });

  try {
    console.log('🚀 Navigating to home page...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });

    console.log('\n⏳ Waiting 10 seconds to see if hydration happens...');
    await page.waitForTimeout(10000);

    const allText = await page.evaluate(() => document.body.innerText.trim());
    console.log('\n📄 Visible text:', allText);

    const divs = await page.locator('div').count();
    const buttons = await page.locator('button').count();
    console.log(`\n🔍 Elements: ${divs} divs, ${buttons} buttons`);

    if (pageErrors.length > 0) {
      console.log('\n❌ Page Errors:', pageErrors);
    }

    await page.screenshot({ path: '/tmp/debug-home-10s.png', fullPage: true });
    console.log('\n📸 Screenshot saved');

    console.log('\n⏳ Keeping browser open for 10 more seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/debug-home-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
