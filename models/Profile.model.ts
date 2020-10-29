import { Types } from 'mongoose';
import * as mongoose from 'mongoose';

export const PROFILE_COLLECTION_NAME = 'profile_4';

export interface ProfileDataInterface {
    _id: Types.ObjectId;
    timezone_id: string;
    device_name: string;
    is_running: boolean;
    cookies?: string;
    last_time?: number;
}

export interface ProfileModelInterface extends mongoose.Document, ProfileDataInterface {
    _id: Types.ObjectId;
    id: string;
    created_at: Date;
    updated_at: Date;
}

const statics = {};

const schema = new mongoose.Schema(
    {
        timezone_id: String,
        device_name: String,
        is_running: {
            type: Boolean,
            default: false,
        },
        cookies: String,
        session_storage: String,
        last_time: Number,
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    },
);

schema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
    return this._id.toHexString();
});

schema.statics = statics;

schema.pre('save', async function (this: ProfileModelInterface, next) {
    if (false) {
        return next(new Error('Invalid data'));
    }

    next();
});

export const ProfileModel = mongoose.model<ProfileModelInterface>(
    PROFILE_COLLECTION_NAME,
    schema,
    PROFILE_COLLECTION_NAME,
);
