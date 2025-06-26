import { z } from 'zod';
import { TIncidentSevearity, TReportType, TStatus } from './report.constant';
import mongoose from 'mongoose';

const ObjectIdRegex = /^[0-9a-fA-F]{24}$/; // Regular expression to check for valid ObjectId

export const createReportValidationSchema = z.object({
  body: z.object({

    siteId: z.string({
        required_error: 'siteId is required, siteId must be a valid mongoose object id .',
        invalid_type_error: 'siteId must be a string.',
      }).refine(value => ObjectIdRegex.test(value), {
      message: 'Invalid siteId format. Must be a valid ObjectId.',
    }),

    reportType: z
      .string({
        required_error: 'reportType is not required.',
        invalid_type_error: 'reportType must be a string.',
      })
      .refine(reportType => Object.keys(TReportType).includes(reportType as keyof typeof TReportType), {
        message: `reportType must be one of the following: ${Object.keys(TReportType).join(', ')}`,
      }),

    incidentSevearity :  z
      .string({
        required_error: 'incidentSevearity is not required.',
        invalid_type_error: 'incidentSevearity must be a string.',
      })
      .refine(incidentSevearity => Object.keys(TIncidentSevearity).includes(incidentSevearity as keyof typeof TIncidentSevearity), {
        message: `incidentSevearity must be one of the following: ${Object.keys(TIncidentSevearity).join(', ')}`,
      }),

    title: z  
    .string({
        required_error: 'title is required, title must be a string.',
        invalid_type_error: 'title must be a string.',
      }).min(5, {
      message: 'title must be at least 5 characters long.',
    }).max(500, {
      message: 'title must be at most 500 characters long.',
    }),

    description: z  
    .string({
        required_error: 'description is required, description must be a string.',
        invalid_type_error: 'description must be a string.',
      }).min(5, {
      message: 'description must be at least 5 characters long.',
    }).max(500, {
      message: 'description must be at most 500 characters long.',
    }),

    location: z.string().optional(), // ekhane jei site er jonno report kora hoise shetar location dekhabe .. 

    personName: z.string().optional(), 

    attachments: z
      .array(z.string(), {
        required_error: 'attachments is required, attachments must be an array of strings.',
        invalid_type_error: 'attachments must be an array of strings.',
      }).optional(),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});

export const changeStatusOfAReportValidationSchema = z.object({
  body: z.object({
    status: z
      .string({
        required_error: 'status is required.',
        invalid_type_error: 'status must be a string.',
      }).refine(status => Object.keys(TStatus).includes(status as keyof typeof TStatus), {
        message: `status must be one of the following: ${Object.keys(TStatus).join(', ')}`,
      })
  }),

  params: z.object({
    id: z.string({
        required_error: 'id is required in params.',
        invalid_type_error: 'id must be a mongoose object.',
      }).refine(value => mongoose.Types.ObjectId.isValid(value), {
        message: 'id must be a valid mongoose ObjectId.',
      }), 
  }),

  // query: z.object({
  //   page: z.string().optional(),
  // }),
});







