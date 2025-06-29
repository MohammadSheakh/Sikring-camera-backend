import { model, Schema } from 'mongoose';
import { IcustomerReport, IcustomerReportModel } from './customerReport.interface';
import paginate from '../../../common/plugins/paginate';
import { Roles } from '../../../middlewares/roles';
import { TReportType } from '../report/report.constant';

const customerReportSchema = new Schema<IcustomerReport>(
  {
    personId: {  // who is related to this report .. he can write this report or just assigned to this report .
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'customerId is required'],
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'reportId is required'],
    },
    role: {
      type: String,
      enum: {
        values: Roles,
        message: '${VALUE} is not a valid role', // 🔥 fix korte hobe .. 
      },
      required: [true, 'Role is required'],
    },
    reportType : {
        type: String,
        enum:  [TReportType.alarmPatrol, TReportType.patrolReport, TReportType.service, TReportType.emergency_call_out],
        required: [
          false,
          `reportType is required it can be ${Object.values(
            TReportType
          ).join(', ')}`,
        ],
        // default: TReportType.alarmPatrol, // INFO : no default value for reportType
    },

    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

customerReportSchema.plugin(paginate); // paginate ///  paginateV2 // paginateDebug

customerReportSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
customerReportSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._customerReportId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const customerReport = model<
  IcustomerReport,
  IcustomerReportModel
>('CustomerReport', customerReportSchema);
