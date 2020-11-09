import { parallelLimit } from 'async';
import * as mongoose from 'mongoose';
import { allLinks } from './links';
import { view } from './utils/view15';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

const run2 = async () => {
    setTimeout(() => {
        process.exit(0);
    }, 50 * 60 * 1000);
    await mongoose.connect(process.env.MONGO_URI);
    const promises = [];
    for (let i = 0; i < 40; i++) {
        const link = allLinks[getRandomInt(allLinks.length)];
        // const link = 'https://m.youtube.com/watch?v=HcTln99Keh4';
        promises.push((callback) => {
            console.log(i, link);
            setTimeout(() => {
                view(link)
                    .then(callback)
                    .catch((err) => {
                        console.error(err);
                        callback();
                    });
            }, (i % 4) * 10000);
        });
    }
    parallelLimit(promises, Number(process.env.NUMBER_PARALLEL) || 4, async () => {
        await mongoose.disconnect();
        process.exit(0);
    });
};

process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p);
        process.exit(0);
    })
    .on('uncaughtException', (err) => {
        console.error(err, 'Uncaught Exception thrown');
        process.exit(0);
    });

run2().catch((e) => {
    console.error(e);
    process.exit(0);
});
// createDeviceData().then(() => {
//     console.log('done');
// });
