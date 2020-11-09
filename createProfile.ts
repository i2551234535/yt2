import * as mongoose from 'mongoose';
import { allDevices } from './devices';
import { ProfileModel } from './models/Profile.model';
import { allTimezone } from './timezoneId';
import { createDeviceData } from './utils/createData2';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

createDeviceData().then(() => {
    console.log('done');
});
