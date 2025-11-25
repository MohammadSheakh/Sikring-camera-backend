import { model, Schema } from 'mongoose';
import { IPredefinedCustomDescription, IPredefinedCustomDescriptionModel } from './predefinedCustomDescription.interface';
import paginate from '../../../common/plugins/paginate';

const PredefinedCustomDescriptionSchema = new Schema<IPredefinedCustomDescription>(
  {
    description: {
      type: String,
      required: [true, 'dateOfBirth is required'],
    },
    langCodeOfDescription: {
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

PredefinedCustomDescriptionSchema.plugin(paginate);

PredefinedCustomDescriptionSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
PredefinedCustomDescriptionSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._PredefinedCustomDescriptionId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const PredefinedCustomDescription = model<
  IPredefinedCustomDescription,
  IPredefinedCustomDescriptionModel
>('PredefinedCustomDescription', PredefinedCustomDescriptionSchema);
