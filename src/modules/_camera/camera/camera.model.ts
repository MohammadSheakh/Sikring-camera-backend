import { model, Schema } from 'mongoose';
import { Icamera, IcameraModel } from './camera.interface';
import paginate from '../../../common/plugins/paginate';
import { TStatus } from './camera.constant';


const cameraSchema = new Schema<Icamera>(
  {
    
    // siteName : {
    //   type: String,
    //   required: [false, 'siteName is not required'],
    // },

    localLocation : {
      type: String,
      required: [false, 'localLocation is not required'],
    },
    globalLocation : {
      type: String,
      required: [false, 'globalLocation is not required'],
    },
    lat: {
      type: String,
      required: [false, 'lat is not required'],
    },
    long: {
      type: String,
      required: [false, 'long is not required'],
    },

    // ISSUE : status er input field ba change korar option UI te ase kina tamim vai er shathe kotha bolte hobe .. 
    status : {
      type: String,
      enum:  [TStatus.offline, TStatus.working],
      required: [
        false,
        `Status is required it can be ${Object.values(
          TStatus
        ).join(', ')}`,
      ],
      default: TStatus.offline,
    },

    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [true, 'Attachments is required'],
      }
    ],

    assignedManagerId : {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [false, 'assignedManagerId is not required'],
    },
    assignedUserId : {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [false, 'assignedUserId is not required'],
    },

    description: {
      type: String,
      required: [false, 'description is not required'],
    },
    cameraName : {
      type: String,
      required: [true, 'cameraName is required'],
    },
    cameraUsername: {
      type: String,
      required: [true, 'cameraUsername is required'],
    },
    cameraPassword : {
      type: String,
      required: [true, 'cameraPassword is required'],
    },
    cameraIp : {
      type: String,
      required: [true, 'cameraIp is required'],
    },
    cameraPort : {
      type: String,
      required: [true, 'cameraPort is required'],
    },
    cameraPath: {
      type: String,
      required: [false, 'cameraPath is required'],
      default: '',
    },
    rtspUrl: {
      type: String,
      required: [true, 'rtspUrl is required'],
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
>('Camera', cameraSchema);
