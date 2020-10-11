import { webkit, devices } from 'playwright';
import { allTimezone } from './timezoneId';
import { allDevices } from './devices';
import * as mongoose from 'mongoose';
import { ProfileModel } from './models/Profile.model';
import { parallelLimit } from 'async';
import { allLinks } from './links';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

const createDeviceData = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    for (let i = 0; i < 1000; i++) {
        const timezoneId = allTimezone[getRandomInt(allTimezone.length)];
        const deviceName = allDevices[getRandomInt(allDevices.length)];

        console.log(i);

        await ProfileModel.findOneAndUpdate(
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
            },
        );
    }
};

const view = async (url: string) => {
    const totalProfile = await ProfileModel.find({}).countDocuments();
    const profileData = await ProfileModel.findOne({
        is_running: false,
    }).skip(getRandomArbitrary(0, totalProfile));

    console.log(profileData);

    profileData.is_running = true;
    await profileData.save();

    const browser = await webkit.launch({
        // headless: false,
    });

    const device = devices[profileData.device_name];

    const context = await browser.newContext({
        ...device,
        timezoneId: profileData.timezone_id,
    });

    if (profileData.cookies) {
        await context.addCookies(JSON.parse(profileData.cookies));
    }

    const page = await context.newPage();
    await page.goto(url);
    const timeout = getRandomArbitrary(60000, 120000);
    console.log(timeout);
    console.log(await context.cookies());
    return new Promise(async (res, rej) => {
        setTimeout(async () => {
            console.log('close');
            try {
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
                await browser.close();
                res();
            } catch (error) {
                profileData.is_running = false;
                await profileData.save();
                rej(error);
            }
        }, timeout);
    });
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push((callback) => {
                view('https://www.youtube.com/watch?v=c0l3Km1IQfE').then(callback);
            });
        }
        parallelLimit(promises, 5);
    } catch (error) {
        console.error(error);
    } finally {
        console.log('Done');
        await mongoose.disconnect();
    }
};

const run2 = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const promises = [];
    for (let i = 0; i < 5; i++) {
        const link = 'https://www.youtube.com/watch?v=c0l3Km1IQfE';
        promises.push((callback) => {
            console.log(i, link);
            view(link).then(callback).catch(callback);
        });
    }
    parallelLimit(promises, 5, async () => {
        await mongoose.disconnect();
    });
};

run2();
// createDeviceData().then(() => {
//     console.log('done');
// });
