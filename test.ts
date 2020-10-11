import * as mongoose from 'mongoose';
import { view } from './utils/view3';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await view('https://m.youtube.com/watch?v=c0l3Km1IQfE');
    } catch (error) {
        console.error(error);
    } finally {
        console.log('Done');
        await mongoose.disconnect();
    }
};

run();
