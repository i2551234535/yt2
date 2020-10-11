import { devices, webkit } from 'playwright';
import { ProfileModel } from '../models/Profile.model';

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export const view = async (url: string) => {
    const totalProfile = await ProfileModel.find({
        is_running: false,
    }).countDocuments();
    const profileData = await ProfileModel.findOne({
        is_running: false,
    }).skip(getRandomArbitrary(0, totalProfile));

    console.log(profileData);

    profileData.is_running = true;
    await profileData.save();

    const browser = await webkit.launch({
        headless: false,
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

    const timeout = getRandomArbitrary(60000, 120000);
    console.log(timeout);
    return new Promise(async (res, rej) => {
        page.goto(url);
        console.log(await context.cookies());
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
