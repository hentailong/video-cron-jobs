
import { workerData, parentPort } from 'worker_threads';
import { firefox } from "playwright";
import juice from "juice";
import fs from "fs";
import path from "path";

(async () => {
    const browser = await firefox.launch({
        headless: true,
        ignoreDefaultArgs: ['--mute-audio']
    });

    const teacherContext = await browser.newContext({
        // viewport: { width: 1280, height: 720 },
        bypassCSP: true, // 绕过内容安全策略
    });

    const teacherPage = await teacherContext.newPage();
    await teacherPage.goto(workerData.path);
    await teacherPage.waitForSelector('.fl01');
    await teacherPage.$$eval('.imged img', nodes => {
        nodes.forEach(node => {
            node.style.display = 'block';
        });
        return nodes;
    })
    const htmlContent = await teacherPage.content();
    // 使用 juice 内联 CSS
    const htmlWithInlinedStyles = await new Promise((resolve, reject) => {
        juice.juiceResources(htmlContent, { webResources: { relativeTo: 'https://www.auto.uestc.edu.cn', rebaseRelativeTo: 'https://www.auto.uestc.edu.cn', images: true, svgs: true } }, (err, html) => {
            if (err) {
                reject(err);
            }
            resolve(html)
        });
    })
    // 存储地址
    const exportPath = path.join(path.resolve(), 'export');

    if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
    }

    let filePath = path.join(exportPath, workerData.name + '.html');

    fs.writeFileSync(filePath, htmlWithInlinedStyles);

    // 将结果发送回主线程
    parentPort.postMessage(true);
})()