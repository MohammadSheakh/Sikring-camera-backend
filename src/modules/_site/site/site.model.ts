import { model, Schema } from 'mongoose';
import { ISite, IsiteModel } from './site.interface';

import { TStatusType } from '../../user/user.constant';
import { TSiteType } from './site.constant';
import paginate from '../../../common/plugins/paginate';

const siteSchema = new Schema<ISite>(
{
    name: {
      type: String,
      required: [true, 'name is required'],
    },
    address: {
      type: String,
      required: [true, 'address is required'],
    },
    lat: {
      type: String,
      required: [false, 'lat is not required'],
    },
    long: {
      type: String,
      required: [false, 'long is not required'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'phoneNumber is required'],
    },
    customerName : {
      type: String,
      required: [false, 'customerName is not required'],
    },

    type : {
      type: String,
      enum:  [TSiteType.liveEvent, TSiteType.construction, TSiteType.other],
      required: [
        false,
        `Status is required it can be ${Object.values(
          TSiteType
        ).join(', ')}`,
      ],
      default: TSiteType.other,
    },

    status : {
      type: String,
      enum:  [TStatusType.active, TStatusType.inactive],
      required: [
        false,
        `Status is required it can be ${Object.values(
          TStatusType
        ).join(', ')}`,
      ],
      default: TStatusType.active,
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [true, 'Attachments is required'],
      }
    ],
    // tenant_id: {

    // }

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

export const Site = model<
  ISite,
  IsiteModel
>('Site', siteSchema);
