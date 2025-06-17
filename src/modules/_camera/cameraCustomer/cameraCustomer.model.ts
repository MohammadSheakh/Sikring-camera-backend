import { model, Schema } from 'mongoose';
import { IcameraCustomer, IcameraCustomerModel } from './cameraCustomer.interface';
import paginate from '../../common/plugins/paginate';


const cameraCustomerSchema = new Schema<IcameraCustomer>(
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

cameraCustomerSchema.plugin(paginate);

cameraCustomerSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
cameraCustomerSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._cameraCustomerId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const cameraCustomer = model<
  IcameraCustomer,
  IcameraCustomerModel
>('cameraCustomer', cameraCustomerSchema);
