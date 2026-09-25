const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 395, height: 850 } });

  await page.goto('http://localhost:3000');
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'foxai123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: '/home/jules/verification/opt_txt2img_dashboard.png' });
  await browser.close();
  console.log('Screenshot taken successfully');
})();
