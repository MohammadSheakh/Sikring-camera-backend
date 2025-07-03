import mongoose from 'mongoose';
import { z } from 'zod';

export const createHelpMessageValidationSchema = z.object({
  body: z.object({
    auditLog: z  
    .string({
        required_error: 'auditLog is required, auditLog must be a string.',
        invalid_type_error: 'dateOfBirth must be a string.',
      }).min(5, {
      message: 'auditLog must be at least 5 characters long.',
    }).max(500, {
      message: 'auditLog must be at most 500 characters long.',
    }),
    
    userId: z
    .string({
        required_error: 'userId is required, userId must be a string.',
        invalid_type_error: 'userId must be a string.',
     }).refine(value => mongoose.Types.ObjectId.isValid(value), {
        message: 'id must be a valid mongoose ObjectId.',
     }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






