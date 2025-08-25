import { model, Schema } from 'mongoose';
import { IauditLog, IauditLogModel } from './auditLog.interface';
import paginate from '../../common/plugins/paginate';
import { Roles } from '../../middlewares/roles';
import { TStatus } from './auditLog.constant';


const auditLogSchema = new Schema<IauditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: {
        values: Roles,
        message: '${VALUE} is not a valid role', // 🔥 fix korte hobe .. 
      },
      required: [true, 'Role is required'],
    },

    actionPerformed : {
      type: String,
      required: [true, 'actionPerformed is required'],
    },

    status : {
      type: String,
      enum:  [TStatus.active, TStatus.pending, TStatus.success, TStatus.failed],
      required: [
        true,
        `Status is required it can be ${Object.values(
          TStatus
        ).join(', ')}`,
      ],
    },

    // tenant_id: {
    //   type: String,
    //   required: [true, 'tenant_id is required'],
    // },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

auditLogSchema.plugin(paginate);

auditLogSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
auditLogSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._auditLogId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const auditLog = model<
  IauditLog,
  IauditLogModel
>('auditLog', auditLogSchema);
