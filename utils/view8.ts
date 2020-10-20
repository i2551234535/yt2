import { ViewportSize, webkit, WebKitBrowser } from 'playwright';
import { ProfileTVModel } from '../models/ProfileTV.model';
import { delay } from './delay';

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export const view = async (url: string) => {
    let running = true;
    return new Promise(async (resolve, reject) => {
        const now = new Date().getTime();
        let browser: WebKitBrowser | undefined;
        let step = 0;
        setTimeout(async () => {
            if (running) {
                if (browser) await browser.close();
                reject(new Error('Timeout at ' + step));
            }
        }, 100 * 1000);
        browser = await webkit.launch({
            // headless: false,
        });
        step = 1;

        const totalProfile = await ProfileTVModel.find({}).countDocuments();
        const profileData = await ProfileTVModel.findOne({}).skip(getRandomArbitrary(0, totalProfile));

        // profileData.is_running = true;
        // await profileData.save();

        let viewport: ViewportSize = {
            width: 1280,
            height: 720,
        };

        switch (profileData.size_type) {
            case 1:
                viewport = {
                    width: 1366,
                    height: 768,
                };
                break;
            case 2:
                viewport = {
                    width: 1920,
                    height: 1080,
                };
                break;
            case 3:
                viewport = {
                    width: 1360,
                    height: 760,
                };
                break;
        }

        try {
            const context = await browser.newContext({
                userAgent: profileData.user_agent,
                viewport,
            });

            const page = await context.newPage();
            step = 2;

            const timeout = getRandomArbitrary(40000, 80000);
            console.log(timeout);

            await page.goto(url);
            await delay(3000);
            await page.press('body', 'Enter');
            await delay(10000);
            await page.press('body', 'Enter');

            await delay(timeout);
            console.log(await context.cookies());
            await ProfileTVModel.findOneAndUpdate(
                {
                    _id: profileData._id,
                },
                {
                    $set: {
                        cookies: JSON.stringify(await context.cookies()),
                        last_time: now,
                    },
                },
            );
        } catch (error) {
            throw error;
        } finally {
            profileData.last_time = now;
            await profileData.save();
            await browser.close();
            resolve();
        }
    });
};
