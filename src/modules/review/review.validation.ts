import { z } from 'zod';

export const createReviewValidationSchema = z.object({
  body: z.object({
    rating: z  
    .number({
        required_error: 'rating is required, rating must be a number.',
        invalid_type_error: 'rating must be a number.',
      }).min(1, {
      message: 'Rating must be at least 1.',
    }).max(5, {
      message: 'Rating must be at most 5.',
    }),
    comment: z
    .string({
      required_error: 'Comment is required.',
      invalid_type_error: 'Comment must be a string.',
    })
    .min(1, {
      message: 'Comment must be at least 1 character long.',
    }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






