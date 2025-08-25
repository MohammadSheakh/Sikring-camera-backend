import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import { Roles } from '../../../middlewares/roles';
import { ICameraPerson, ICameraPersonModel } from './cameraPerson.interface';
import { ViewPermission } from './cameraPerson.constant';


const CameraPersonSchema = new Schema<ICameraPerson>(
  {
    cameraId: {
      type: Schema.Types.ObjectId,
      ref: 'Camera',
      required: [true, 'cameraId is required'],
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'personId is required'],
    },

    // INFO : This is important .. 
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'siteId is required'],
    },

    status : {
      type: String,
      enum:  [ViewPermission.disable, ViewPermission.enable],
      required: [
        false,
        `Status is required it can be ${Object.values(
          ViewPermission
        ).join(', ')}`,
      ],
      default: ViewPermission.disable,
    },

    role: {
      type: String,
      enum: {
        values: Roles,
        message: '${VALUE} is not a valid role', // 🔥 fix korte hobe .. 
      },
      required: [false, 'Role is not required'], // ISSUE : role age required chilo .. ar eta dorkar o chilo .. but issue fix kora jacche na .. multiple person ke camera er permission dite giye .. 
    },

    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

CameraPersonSchema.plugin(paginate);

CameraPersonSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
CameraPersonSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._CameraPersonId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const CameraPerson = model<
  ICameraPerson,
  ICameraPersonModel
>('CameraPerson', CameraPersonSchema);
