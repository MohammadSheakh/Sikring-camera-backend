import { settingsType } from './settings.constant';

export interface ISettings {
  _id: string;
  type:
    | settingsType.aboutUs
    | settingsType.contactUs
    | settingsType.privacyPolicy
    | settingsType.termsAndConditions;
  contactUs? : Object;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}
