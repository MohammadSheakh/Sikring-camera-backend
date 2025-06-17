import { model, Schema } from 'mongoose';
import { Isite, IsiteModel } from './site.interface';
import paginate from '../../../common/plugins/paginate';

const siteSchema = new Schema<Isite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      required: [true, 'dateOfBirth is required'],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

siteSchema.plugin(paginate);

siteSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
siteSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._siteId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const site = model<
  Isite,
  IsiteModel
>('site', siteSchema);
