import * as mongoose from 'mongoose';
import { ProfileTVModel } from '../models/ProfileTV.model';
import { allUserAgent } from '../userAgent';
import { ViewportSize, chromium } from 'playwright';
import { delay } from './delay';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

export const createTVData = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    for (let i = 0; i < 100; i++) {
        const userAgent = allUserAgent[getRandomInt(allUserAgent.length)];
        const type = getRandomInt(5);

        console.log(i);

        const newData = new ProfileTVModel({
            user_agent: userAgent,
            is_running: false,
            size_type: type,
        });

        const data = await newData.save();

        let viewport: ViewportSize = {
            width: 1280,
            height: 720,
        };

        switch (data.size_type) {
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

        const context = await chromium.launchPersistentContext('./profiles_tv/' + data._id.toHexString(), {
            userAgent: data.user_agent,
            viewport,
            headless: false,
        });

        const page = await context.newPage();

        await page.goto('https://www.youtube.com/tv#/');
        await page.keyboard.press('ArrowDown');
        await delay(500);
        await page.keyboard.press('Enter');

        await context.close();
    }
    await mongoose.disconnect();
};
