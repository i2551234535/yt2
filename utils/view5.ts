import { devices, webkit, WebKitBrowser } from 'playwright';
import { ProfileModel } from '../models/Profile.model';
import { delay } from './delay';

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export const view = async (url: string) => {
    let running = true;
    return new Promise(async (resolve, reject) => {
        let browser: undefined | WebKitBrowser;
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

        const totalProfile = await ProfileModel.find({
            is_running: false,
        }).countDocuments();
        const profileData = await ProfileModel.findOne({
            is_running: false,
        }).skip(getRandomArbitrary(0, totalProfile));

        console.log(profileData);

        profileData.is_running = true;
        await profileData.save();

        try {
            const device = devices[profileData.device_name];

            const context = await browser.newContext({
                ...device,
                timezoneId: profileData.timezone_id,
            });

            if (profileData.cookies) {
                await context.addCookies(JSON.parse(profileData.cookies));
            }

            const page = await context.newPage();
            step = 2;

            const random = getRandomArbitrary(0, 10);

            let timeout = getRandomArbitrary(40000, 80000);
            if (random < 3) {
                await page.goto(
                    'http://gamevn.com/threads/youtube-clips-thu-gian-v56-di-mot-ngay-dang-luom-mot-dong-xu.1077912/page-1964',
                );
                timeout = 1000;
            } else if (random < 8) {
                await page.goto(url);
                step = 3;
                try {
                    await page.waitForSelector("//div[normalize-space(.)='Tap to unmute']/div[1]");
                    step = 4;
                    await page.hover("//div[normalize-space(.)='Tap to unmute']/div[1]");
                    step = 5;
                    await page.click("//div[normalize-space(.)='Tap to unmute']/div[1]");
                    step = 6;
                } catch (error) {}
            } else {
                await page.goto('https://m.youtube.com');
                step = 7;
                await page.waitForSelector('css=.large-media-item-thumbnail-container');
                step = 8;
                const data = await page.$$('css=.large-media-item-thumbnail-container');
                step = 9;
                await page.$$eval(
                    '.large-media-item-thumbnail-container',
                    (elements, url) => {
                        elements[3].setAttribute('href', url);
                    },
                    url,
                );
                step = 10;
                await data[3].scrollIntoViewIfNeeded();
                await delay(1000);
                await data[3].hover();
                await data[3].click();
                step = 11;
            }

            await delay(timeout);
            await ProfileModel.findOneAndUpdate(
                {
                    _id: profileData._id,
                },
                {
                    $set: {
                        cookies: JSON.stringify(await context.cookies()),
                        is_running: false,
                    },
                },
            );
        } catch (error) {
            throw error;
        } finally {
            profileData.is_running = false;
            await profileData.save();
            await browser.close();
            resolve();
        }
    });
};
