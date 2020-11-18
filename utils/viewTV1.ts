import { ViewportSize, chromium, BrowserContext } from 'playwright';
import { ProfileTVModel } from '../models/ProfileTV.model';
import { delay } from './delay';

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export const view = async (url: string) => {
    let running = true;
    return new Promise(async (resolve, reject) => {
        const now = new Date().getTime();
        let context: BrowserContext | undefined;
        setTimeout(async () => {
            if (running) {
                try {
                    if (context) await context.close();
                } catch (error) {}
                reject(new Error('Timeout'));
            }
        }, 5 * 60 * 1000);

        const totalProfile = await ProfileTVModel.find({}).countDocuments();
        const profileData = await ProfileTVModel.findOne({}).skip(getRandomArbitrary(0, totalProfile));

        await profileData.save();

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
            const context = await chromium.launchPersistentContext('./profiles_tv/' + profileData._id.toHexString(), {
                userAgent: profileData.user_agent,
                viewport,
                headless: process.env.HEADLESS === '0' ? false : true,
            });

            const page = await context.newPage();

            try {
                if (profileData.cookies) {
                    await context.addCookies(JSON.parse(profileData.cookies));
                }
            } catch (error) {}

            const timeout = getRandomArbitrary(3 * 60 * 1000, 4 * 60 * 1000);
            console.log(timeout);

            await page.goto(url);
            await delay(3000);
            await page.keyboard.press('Enter');
            await delay(10000);
            await page.keyboard.press('Enter');
            await delay(1000);
            for (let i = 0; i < getRandomArbitrary(1, 3); i++) {
                await page.keyboard.press('ArrowDown');
                await delay(500);
            }
            for (let i = 0; i < getRandomArbitrary(1, 5); i++) {
                await page.keyboard.press('ArrowRight');
                await delay(500);
            }
            await page.keyboard.press('Enter');
            await delay(500);
            for (let i = 0; i < getRandomArbitrary(1, 3); i++) {
                await page.keyboard.press('ArrowDown');
                await delay(500);
            }
            for (let i = 0; i < getRandomArbitrary(1, 5); i++) {
                await page.keyboard.press('ArrowRight');
                await delay(500);
            }

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
            profileData.last_time = now;
            await profileData.save();
            try {
                await context.close();
            } catch (error) {
                console.log(error);
            }
            resolve();
        } catch (error) {
            console.log(error);
            try {
                await context.close();
            } catch (error) {
                console.log(error);
            }
        }
    });
};
