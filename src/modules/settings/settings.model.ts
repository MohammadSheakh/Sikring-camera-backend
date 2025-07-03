import { model, Schema } from 'mongoose';
import { ISettings } from './settings.interface';
import { settingsType } from './settings.constant';

const settingsSchema = new Schema<ISettings>(
  {
    type: {
      type: String,
      enum: [
        settingsType.aboutUs, // Imp
        settingsType.contactUs, // this will not work
        settingsType.privacyPolicy, // Imp
        settingsType.termsAndConditions, // Imp
      ],
      required: true,
    },
    details: {
      type: String,
      required: false,
    },
    contactUs:{
      type: Object,
      required: false, // This is optional
    }
  },
  {
    timestamps: true,
  }
);

export const Settings = model<ISettings>('Settings', settingsSchema);
