import { parallelLimit } from 'async';
import * as mongoose from 'mongoose';
import { allLinks } from './linksTV';
import { view } from './utils/view8';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

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
    setTimeout(() => {
        process.exit(0);
    }, 50 * 60 * 1000);
    await mongoose.connect(process.env.MONGO_URI);
    const promises = [];
    for (let i = 0; i < 50; i++) {
        const link = allLinks[getRandomInt(allLinks.length)];
        promises.push((callback) => {
            console.log(i, link);
            view(link)
                .then(callback)
                .catch((err) => {
                    console.error(err);
                    callback();
                });
        });
    }
    parallelLimit(promises, 1, async () => {
        await mongoose.disconnect();
        process.exit(0);
    });
};

run2().catch((e) => {
    console.error(e);
    process.exit(0);
});
// createDeviceData().then(() => {
//     console.log('done');
// });
