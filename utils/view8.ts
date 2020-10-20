import { devices, webkit, WebKitBrowser } from 'playwright';
import { ProfileModel } from '../models/Profile.model';
import { delay } from './delay';

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export const view = async (url: string) => {
    let running = true;
    return new Promise(async (resolve, reject) => {
        let browser: WebKitBrowser | undefined;
        let step = 0;
        setTimeout(async () => {
            if (running) {
                if (browser) await browser.close();
                reject(new Error('Timeout at ' + step));
            }
        }, 100 * 1000);
        browser = await webkit.launch({
            headless: false,
        });
        step = 1;

        try {
            const context = await browser.newContext({
                userAgent:
                    'Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.5) AppleWebKit/537.36 (KHTML, like Gecko) 69.0.3497.106.1/5.5 TV Safari/537.36',
                viewport: {
                    width: 1280,
                    height: 720,
                },
            });

            const page = await context.newPage();
            step = 2;

            const timeout = getRandomArbitrary(40000, 80000);
            console.log(timeout);

            await page.goto('https://www.youtube.com/tv#/watch?v=c0l3Km1IQfE');

            await delay(timeout);
            console.log(await context.cookies());
        } catch (error) {
            throw error;
        } finally {
            await browser.close();
            resolve();
        }
    });
};
