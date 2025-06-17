import { model, Schema } from 'mongoose';
import { Icamera, IcameraModel } from './camera.interface';
import paginate from '../../common/plugins/paginate';


const cameraSchema = new Schema<Icamera>(
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

cameraSchema.plugin(paginate);

cameraSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
cameraSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._cameraId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const camera = model<
  Icamera,
  IcameraModel
>('camera', cameraSchema);
