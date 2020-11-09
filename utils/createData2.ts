import * as mongoose from 'mongoose';
import { allDevices } from '../devices';
import { ProfileModel } from '../models/Profile.model';
import { allTimezone } from '../timezoneId';
import { devices, webkit } from 'playwright';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

export const createDeviceData = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    for (let i = 0; i < 50; i++) {
        const timezoneId = allTimezone[getRandomInt(allTimezone.length)];
        const deviceName = allDevices[getRandomInt(allDevices.length)];

        console.log(i);

        const data = await ProfileModel.findOneAndUpdate(
            {
                timezone_id: timezoneId,
                device_name: deviceName,
            },
            {
                $set: {
                    timezone_id: timezoneId,
                    device_name: deviceName,
                    is_running: false,
                },
            },
            {
                upsert: true,
                new: true,
            },
        );

        const device = devices[deviceName];

        const context = await webkit.launchPersistentContext('./profiles/' + data._id.toHexString(), {
            // headless: false,
            ...device,
        });

        // const context = await browser.newContext({
        //     ...device,
        // });

        const page = await context.newPage();

        await page.goto('https://bing.com');
        await context.close();
    }
    await mongoose.disconnect();
};
