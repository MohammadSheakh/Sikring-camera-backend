import { z } from 'zod';
import { TStatusType } from '../../user/user.constant';
import { TSiteType } from './site.constant';

export const createSiteValidationSchema = z.object({
  body: z.object({
    name: z  
    .string({
        required_error: 'name is required, name must be a string.',
        invalid_type_error: 'name must be a string.',
      }).min(3, {
      message: 'name must be at least 3 characters long.',
    }).max(500, {
      message: 'name must be at most 500 characters long.',
    }),
    address: z
    .string({
        required_error: 'address is required, address must be a string.',
        invalid_type_error: 'address must be a string.',
      }).min(3, {
      message: 'address must be at least 3 characters long.',
    }).max(500, {
      message: 'address must be at most 500 characters long.',
    }),
    lat: z
    .string({
        required_error: 'lat is required, lat must be a string.',
        invalid_type_error: 'lat must be a string.',
      }).optional(),
    long: z
    .string({
        required_error: 'long is required, long must be a string.',
        invalid_type_error: 'long must be a string.',
      }).optional(),
    phoneNumber: z
    .string({
        required_error: 'phoneNumber is required, phoneNumber must be a string.',
        invalid_type_error: 'phoneNumber must be a string.',
      }).min(10, {
      message: 'phoneNumber must be at least 10 characters long.',
    }).max(15, {
      message: 'phoneNumber must be at most 15 characters long.',
    }),
    customerName: z
    .string({
        required_error: 'customerName is required, customerName must be a string.',
        invalid_type_error: 'customerName must be a string.',
      }).optional(),
      
    status: z
    .enum([TStatusType.active, TStatusType.inactive], {
      required_error: 'status is required, status must be one of "active" or "inactive".',
      invalid_type_error: 'status must be one of "active" or "inactive".',
    }).optional(),

    type: z
    .enum([TSiteType.construction, TSiteType.liveEvent, TSiteType.other], {
      required_error: 'type is required, type must be one of "construction" or "liveEvent" or "other".',
      invalid_type_error: 'status must be one of "construction" or "liveEvent" or "other".',
    }).optional(),

    // We have to pass the attachments also 

  //   attachments: z
  //   .array(z.instanceof(File), {
  //   required_error: 'attachments is required, and must be an array of files.',
  //   invalid_type_error: 'attachments must be an array of File objects.',
  // }).optional(),

  // attachments: z
  //   .array(z.string(), {
  //   required_error: 'attachments is required, and must be an array of files.',
  //   invalid_type_error: 'attachments must be an array of File objects.',
  // }).optional(),

  }),
    
  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
});






