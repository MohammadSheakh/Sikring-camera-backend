import { model, Schema } from 'mongoose';
import { Ireport, IreportModel } from './report.interface';
import paginate from '../../../common/plugins/paginate';
import { TIncidentSevearity, TReportType, TStatus } from './report.constant';


const reportSchema = new Schema<Ireport>(
  {
    // userId: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    // },

    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
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

    incidentSevearity : {
          type: String,
          enum:  [TIncidentSevearity.low, TIncidentSevearity.medium, TIncidentSevearity.high],
          required: [
            false,
            `incidentSevearity is required it can be ${Object.values(
              TIncidentSevearity
            ).join(', ')}`,
          ],
          // default: TReportType.alarmPatrol, // INFO : no default value for reportType
    },

    title : {
      type: String,
      required: [true, 'title is required'],
    },

    description: {
      type: String,
      required: [true, 'description is required'],
    },

    // TODO : Location koi thke ashbe .. bujhi nai eita 
    // TODO  : UI er kas theke bujhe nite hobe ... 
    location : {
      type: String,
      required: [false, 'location is not required'],
    },

    // INFO : this is just for show in front end who is created the report
    person : {
      type: Object,
      required: [false, 'personName is not required'],
      default: null
    },

    status : {
          type: String,
          enum:  [TStatus.accept, TStatus.deny, TStatus.underReview],
          required: [
            false,
            `status is required it can be ${Object.values(
              TStatus
            ).join(', ')}`,
          ],
        default: TStatus.underReview,
    },

    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [true, 'Attachments is required'],
      }
    ],

    // tenant_id :{

    // },

    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

reportSchema.plugin(paginate);

reportSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
reportSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._reportId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const report = model<
  Ireport,
  IreportModel
>('Report', reportSchema);
