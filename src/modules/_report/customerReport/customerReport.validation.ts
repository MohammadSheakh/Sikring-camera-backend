import { z } from 'zod';

export const createHelpMessageValidationSchema = z.object({
  body: z.object({
    customerReport: z  
    .string({
        required_error: 'customerReport is required, customerReport must be a string.',
        invalid_type_error: 'dateOfBirth must be a string.',
      }).min(5, {
      message: 'customerReport must be at least 5 characters long.',
    }).max(500, {
      message: 'customerReport must be at most 500 characters long.',
    }),
    
    userId: z
    .string({
        required_error: 'userId is required, userId must be a string.',
        invalid_type_error: 'userId must be a string.',
     }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






