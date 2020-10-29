import * as mongoose from 'mongoose';
import { allDevices } from '../devices';
import { ProfileModel } from '../models/Profile.model';
import { allTimezone } from '../timezoneId';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

export const createDeviceData = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    for (let i = 0; i < 200; i++) {
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
    await mongoose.disconnect();
};
