import { model, Schema } from 'mongoose';
import { IcameraSite, IcameraSiteModel } from './cameraSite.interface';
import paginate from '../../../common/plugins/paginate';



const cameraSiteSchema = new Schema<IcameraSite>(
  {
    cameraId: {
      type: Schema.Types.ObjectId,
      ref: 'Camera',
    },
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

cameraSiteSchema.plugin(paginate);

cameraSiteSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
cameraSiteSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._cameraSiteId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const cameraSite = model<
  IcameraSite,
  IcameraSiteModel
>('cameraSite', cameraSiteSchema);
