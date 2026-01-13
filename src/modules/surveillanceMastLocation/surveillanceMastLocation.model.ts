//@ts-ignore
import { model, Schema } from 'mongoose';
import { ISurveillanceMastLocation, ISurveillanceMastLocationModel } from './surveillanceMastLocation.interface';
import paginate from '../../common/plugins/paginate';


const SurveillanceMastLocationSchema = new Schema<ISurveillanceMastLocation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    // 🆕 new requirement
    lat: {
      type: String,
      required: [false, 'lat is not required'],
    },

    // 🆕 new requirement
    long: {
      type: String,
      required: [false, 'long is not required'],
    },
    accuracy : {
      type : Number,
      required : [false, 'accuracy is not required'],
    },
    platform : {
      type : String,
      required : [false, 'platform is not required'],
    },
    deviceModel : {
      type: String,
      required : [false, 'deviceModel is not needed'],
    },
    batteryLevel : {
      type: Number,
      required : [false, 'batteryLevel is not needed']
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

SurveillanceMastLocationSchema.plugin(paginate);

SurveillanceMastLocationSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
SurveillanceMastLocationSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._SurveillanceMastLocationId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const SurveillanceMastLocation = model<
  ISurveillanceMastLocation,
  ISurveillanceMastLocationModel
>('SurveillanceMastLocation', SurveillanceMastLocationSchema);
