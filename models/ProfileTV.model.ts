import { Types } from 'mongoose';
import * as mongoose from 'mongoose';

export const PROFILE_TV_COLLECTION_NAME = 'profile_tv';

export interface ProfileTVDataInterface {
    _id: Types.ObjectId;
    user_agent: string;
    cookies?: string;
    last_time?: number;
    size_type: number;
}

export interface ProfileTVModelInterface extends mongoose.Document, ProfileTVDataInterface {
    _id: Types.ObjectId;
    id: string;
    created_at: Date;
    updated_at: Date;
}

const statics = {};

const schema = new mongoose.Schema(
    {
        user_agent: String,
        cookies: String,
        last_time: Number,
        size_type: {
            type: Number,
            default: 1,
        },
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

schema.pre('save', async function (this: ProfileTVModelInterface, next) {
    if (false) {
        return next(new Error('Invalid data'));
    }

    next();
});

export const ProfileTVModel = mongoose.model<ProfileTVModelInterface>(
    PROFILE_TV_COLLECTION_NAME,
    schema,
    PROFILE_TV_COLLECTION_NAME,
);
