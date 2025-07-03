import { model, Schema } from 'mongoose';
import { TProfileImage, TUser, UserModal } from './user.interface';
import paginate from '../../common/plugins/paginate';
import bcryptjs from 'bcryptjs';
import { config } from '../../config';
import {  TAuthProvider, TStatusType, TSubscriptionType } from './user.constant';
import { Roles } from '../../middlewares/roles';

// Profile Image Schema
const profileImageSchema = new Schema<TProfileImage>({
  imageUrl: {
    type: String,
    required: [true, 'Image url is required'],
    default: '/uploads/users/user.png',
  },
});

// User Schema Definition
const userSchema = new Schema<TUser, UserModal>(
  {
    // personalize_Journey_Id: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'PersonalizeJourney', // Reference to the personalizeJourney schema
    // },
    user_custom_id: {
      type: String,
      required: [false, 'User custom ID is not required'],
      trim: true,
    },


    conversation_restrict_with: {
      type: [String],
    },

    canMessage : {
      type: Boolean,
      required: [false, 'canMessage is not required'],
      default: true, // By default, users can message
    },

    name :{
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phoneNumber : {
      type: String,
      required: [false, 'Phone number is not required'],
    },
    

    profileImage: {
      type: profileImageSchema,
      required: false,
      default: { imageUrl: '/uploads/users/user.png' },
    },
    companyLogoImage: {
      type: String,
      required: false,
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

    role: {
      type: String,
      enum: {
        values: Roles,
        message: '${VALUE} is not a valid role', // 🔥 fix korte hobe .. 
      },
      required: [true, 'Role is required'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    address : {
      type: String,
      required: false, 
    },

    fcmToken: { type: String, default: null }, // Store Firebase Token


    subscriptionType: {
      type: String,
      enum: 
         [TSubscriptionType.free, TSubscriptionType.premium],
      required: [
        false,
        `SubscriptionType is required it can be ${Object.values(
          TSubscriptionType
        ).join(', ')}`,
      ],
      default: TSubscriptionType.free,
    },
    
    

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    
    isDeleted: {
      type: Boolean,
      default: false,
    },
    lastPasswordChange: { type: Date },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: { type: Date }, // 🔴 not sure 

    // ------------ For Payment Related Thing ... 

    stripe_customer_id: {
      // > stripe er customer id ...
      type: String,
      required: [
        false,
        'stripe_customer_id is not required',
      ],
      default: null,
    },

    //------------- New Fields for Google and Apple Login
    googleId: {
      type: String,
      required: false, // Optional if Google login is used
      
    },
    appleId: {
      type: String,
      required: false, // Optional if Apple login is used
      
    },
    authProvider: {
      type: String,
      enum: [TAuthProvider.apple, TAuthProvider.google, TAuthProvider.local],
      default: TAuthProvider.local, // Default to local login if neither Google nor Apple login is used
    },
    googleAccessToken: {
      type: String,
      required: false,
    },
    appleAccessToken: {
      type: String,
      required: false,
    },
    isGoogleVerified: {
      type: Boolean,
      default: false,
    },
    isAppleVerified: {
      type: Boolean,
      default: false,
    },

    //------------- For Google and Apple Login End 

    designation : {  // for user [employee]
      type: String,
      required: false, 
    },

  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Apply the paginate plugin
userSchema.plugin(paginate);

// Static methods
userSchema.statics.isExistUserById = async function (id: string) {
  return await this.findById(id);
};

userSchema.statics.isExistUserByEmail = async function (email: string) {
  return await this.findOne({ email });
};

userSchema.statics.isMatchPassword = async function (
  password: string,
  hashPassword: string,
): Promise<boolean> {
  return await bcryptjs.compare(password, hashPassword);
};

// FIX : ts issue 
// Middleware to hash password before saving
userSchema.pre('save', async function (next) {

  if (this.isModified('password')) {
    this.password = await bcryptjs.hash(
      this.password,
      Number(config.bcrypt.saltRounds),
    );
  }
  next();
});

// Use transform to rename _id to _projectId
userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._userId = ret._id;  // Rename _id to _projectId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});

// Export the User model
export const User = model<TUser, UserModal>('User', userSchema);
