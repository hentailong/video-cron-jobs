import { firefox } from "playwright";
import fs from "fs";
import path from "path";
import juice from "juice";
import { Worker } from 'worker_threads';

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

    // await page.waitForTimeout(5000);  // 等待一定时间让JavaScript执行完成
    // console.log("重定向页面")

    // // 重新请求目标页面
    // await page.goto('https://www.auto.uestc.edu.cn/szdw/jsmlzly.htm', { waitUntil: 'networkidle' });

    await page.waitForSelector('.fl02');

    let teachers = await page.$$eval('.fl02 a', nodes => {
        return nodes.map(node => {
            return {
                name: node.innerText,
                path: 'https://www.auto.uestc.edu.cn/szdw/' + node.getAttribute('href')
            }
        });
    })

    const teacherContext = await browser.newContext({
        // viewport: { width: 1280, height: 720 },
        bypassCSP: true, // 绕过内容安全策略
    });
    // 遍历获取数据
    const teacherPage = await teacherContext.newPage();
    // 已下载的数据
    let downloadCount = 0;
    // 当前线程数量
    let workerCount = 0;
    // 最大线程数量
    const MAX_COUNT = 16;
    
    for (let i = 0; i < teachers.length; i++) {
        let teacher = teachers[i];
        // 判断worker线程是否超出
        if(workerCount >= MAX_COUNT){
            await workerRelease();
        }
        let worker = new Worker("./worker.js", { workerData: { ...teacher } });
        workerCount++;

        worker.on("message",()=>{
            console.log(`${++downloadCount}/${teachers.length} ${teacher.name} downloaded`);
            worker.terminate();
            workerCount--;
            if(teachers.length == downloadCount){
                browser.close();
            }
        })
        //     await teacherPage.goto(teacher.path);
        //     await teacherPage.waitForSelector('.fl01');
        //     await teacherPage.$$eval('.imged img', nodes => {
        //         nodes.forEach(node => {
        //             node.style.display = 'block';
        //         });
        //         return nodes;
        //     })
        //     const htmlContent = await teacherPage.content();
        //     // 使用 juice 内联 CSS
        //     const htmlWithInlinedStyles = await new Promise((resolve, reject) => {
        //         juice.juiceResources(htmlContent, { webResources: { relativeTo: 'https://www.auto.uestc.edu.cn', rebaseRelativeTo: 'https://www.auto.uestc.edu.cn', images: true, svgs: true } }, (err, html) => {
        //             if (err) {
        //                 reject(err);
        //             }
        //             resolve(html)
        //         });
        //     })
        //     // 存储地址
        //     const exportPath = path.join(path.resolve(), 'export');

        //     if (!fs.existsSync(exportPath)) {
        //         fs.mkdirSync(exportPath, { recursive: true });
        //     }

        //     let filePath = path.join(exportPath, teacher.name + '.html');

        //     fs.writeFileSync(filePath, htmlWithInlinedStyles);

        //     
    }


    async function workerRelease(){
        return new Promise((resolve)=>{
            let timer = setInterval(()=>{
                if(workerCount < MAX_COUNT){
                    clearInterval(timer);
                    resolve()
                }
            },100)
        })
    }
    // other actions...
    // await browser.close();
})();
