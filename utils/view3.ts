import { devices, webkit } from 'playwright';
import { ProfileModel } from '../models/Profile.model';
import { delay } from './delay';

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export const view = async (url: string) => {
    let running = true;
    return new Promise(async (resolve, reject) => {
        const browser = await webkit.launch({
            // headless: false,
        });
        setTimeout(async () => {
            if (running) {
                await browser.close();
                reject(new Error('Timeout'));
            }
        }, 120000);

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

            const timeout = getRandomArbitrary(60000, 100000);
            const random = getRandomArbitrary(0, 10);
            console.log(timeout);

            if (random < 8) {
                await page.goto(url);
                try {
                    await page.waitForSelector("//div[normalize-space(.)='Tap to unmute']/div[1]");
                    await page.hover("//div[normalize-space(.)='Tap to unmute']/div[1]");
                    await page.click("//div[normalize-space(.)='Tap to unmute']/div[1]");
                } catch (error) {}
            } else {
                await page.goto('https://m.youtube.com');
                await page.waitForSelector('css=.large-media-item-thumbnail-container');
                const data = await page.$$('css=.large-media-item-thumbnail-container');
                await page.$$eval(
                    '.large-media-item-thumbnail-container',
                    (elements, url) => {
                        elements[3].setAttribute('href', url);
                    },
                    url,
                );
                await data[3].scrollIntoViewIfNeeded();
                await delay(1000);
                await data[3].hover();
                await data[3].click();
            }

            await delay(timeout);
            console.log(await context.cookies());
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
