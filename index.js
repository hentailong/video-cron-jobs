const puppeteer = require('puppeteer');

async function refresh () {
  const browser = await puppeteer.launch({
    headless: true, // 无头模式
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // 适用于VPS的参数
  });
  const page = await browser.newPage();
  await page.goto('http://video.likesyou.org/api.php/Auto/update?token=niuniuzhushouv108&i=1');
  
  // 如果需要执行其他操作，比如等待某些元素加载或点击按钮
  // await page.waitForSelector('selector');
  // await page.click('selector');
  
  console.log('Task executed successfully.');
  await browser.close();
}

refresh();

// 每小时执行一次
setInterval(refresh, 60 * 60 * 1000);