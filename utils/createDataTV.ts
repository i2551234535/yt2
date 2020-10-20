import * as mongoose from 'mongoose';
import { ProfileTVModel } from '../models/ProfileTV.model';
import { allUserAgent } from '../userAgent';

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

        await newData.save();
    }
    await mongoose.disconnect();
};
