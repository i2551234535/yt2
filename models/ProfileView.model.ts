import { Types } from 'mongoose';
import * as mongoose from 'mongoose';

export const PROFILE_VIEW_COLLECTION_NAME = 'profile_view';

export interface ProfileViewDataInterface {
    _id: Types.ObjectId;
    profile_id: mongoose.Types.ObjectId;
    link: string;
    timestamp: number;
    time: string;
}

export interface ProfileViewModelInterface extends mongoose.Document, ProfileViewDataInterface {
    _id: Types.ObjectId;
    id: string;
    created_at: Date;
    updated_at: Date;
}

export interface ProfileViewStaticInterface extends mongoose.Model<ProfileViewModelInterface> {}

const statics = {};

const schema = new mongoose.Schema(
    {
        profile_id: mongoose.Schema.Types.ObjectId,
        link: String,
        timestamp: Number,
        time: String,
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

schema.index({ profile_id: 1, link: 1 });

schema.pre('save', async function (this: ProfileViewModelInterface, next) {
    if (false) {
        return next(new Error('Invalid data'));
    }

    next();
});

export const ProfileViewModel = mongoose.model<ProfileViewModelInterface, ProfileViewStaticInterface>(
    PROFILE_VIEW_COLLECTION_NAME,
    schema,
    PROFILE_VIEW_COLLECTION_NAME,
);
