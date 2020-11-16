import * as mongoose from 'mongoose';
import { allDevices } from './devices';
import { ProfileModel } from './models/Profile.model';
import { allTimezone } from './timezoneId';
import { createTVData } from './utils/createDataTV';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

createTVData().then(() => {
    console.log('done');
});
