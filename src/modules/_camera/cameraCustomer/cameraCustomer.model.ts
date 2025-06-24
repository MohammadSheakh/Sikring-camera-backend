import { model, Schema } from 'mongoose';
import { IcameraCustomer, IcameraCustomerModel } from './cameraCustomer.interface';
import paginate from '../../../common/plugins/paginate';
import { Roles } from '../../../middlewares/roles';
import { ICustomersPermission } from './cameraCustomer.constant';


const cameraCustomerSchema = new Schema<IcameraCustomer>(
  {
    cameraId: {
      type: Schema.Types.ObjectId,
      ref: 'Camera',
      required: [true, 'cameraId is required'],
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'customerId is required'],
    },

    // TODO : need to think about this siteId required  true false
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'siteId is required'],
    },

    status : {
      type: String,
      enum:  [ICustomersPermission.disable, ICustomersPermission.enable],
      required: [
        false,
        `Status is required it can be ${Object.values(
          ICustomersPermission
        ).join(', ')}`,
      ],
      default: ICustomersPermission.disable,
    },

    role: {
      type: String,
      enum: {
        values: Roles,
        message: '${VALUE} is not a valid role', // 🔥 fix korte hobe .. 
      },
      required: [true, 'Role is required'],
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
