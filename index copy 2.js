import { firefox } from "playwright";
import fs from "fs";

(async () => {
    const browser = await firefox.launch({
        headless: true,
        ignoreDefaultArgs: ['--mute-audio']
    });
    const context = await browser.newContext({
        // viewport: { width: 1280, height: 720 },
        bypassCSP: true, // 绕过内容安全策略
    });

    const page = await context.newPage();
    await page.goto('https://www.auto.uestc.edu.cn/szdw/jsmlzly.htm');
    await page.waitForSelector('.fl02');

    let teachers = await page.$$eval('.fl02 a', nodes => {
        return nodes.map(node => {
            return {
                name: node.innerText,
                path: 'https://www.auto.uestc.edu.cn/szdw/' + node.getAttribute('href')
            }
        });
    })

    console.log("共找到" + teachers.length + "条教师数据");

    const teacherContext = await browser.newContext({
        // viewport: { width: 1280, height: 720 },
        bypassCSP: true, // 绕过内容安全策略
    });
    // 遍历获取数据
    const teacherPage = await teacherContext.newPage();

    console.log("正在提取数据...");

    let downloadCount = 0;
    // 创建流式写入
    const ws = fs.createWriteStream('./export.txt');

    for (let i = 0; i < teachers.length; i++) {
        let teacher = teachers[i];
        await teacherPage.goto(teacher.path);
        await teacherPage.waitForSelector('.fl01');

        ws.write(await teacherPage.innerText('.fl01') + '\n\n-----------------------------------------------\n\n');

        console.log(`${++downloadCount}/${teachers.length} ${teacher.name} success`);
    }

    ws.end();

    console.log("数据提取完成");

    // other actions...
    await browser.close();
})();
