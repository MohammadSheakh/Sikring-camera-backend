import { model, Schema } from 'mongoose';
import { ICompanyLogo, ICompanyLogoModel } from './companyLogo.interface';
import paginate from '../../common/plugins/paginate';


const CompanyLogoSchema = new Schema<ICompanyLogo>(
  {
  
    companyName: {
      type: String,
      required: [false, 'companyName is not required'],
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [true, 'Attachments is required'],
      }
    ],
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

CompanyLogoSchema.plugin(paginate);

CompanyLogoSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
CompanyLogoSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._CompanyLogoId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const CompanyLogo = model<
  ICompanyLogo,
  ICompanyLogoModel
>('CompanyLogo', CompanyLogoSchema);
