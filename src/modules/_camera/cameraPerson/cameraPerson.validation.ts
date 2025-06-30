import mongoose from 'mongoose';
import { z } from 'zod';

export const assignCameraPersonValidationSchema = z.object({
  body: z.object({
    cameraId: z.string({
      required_error: 'id is required in params.',
      invalid_type_error: 'id must be a mongoose object.',
    }).refine(value => mongoose.Types.ObjectId.isValid(value), {
      message: 'id must be a valid mongoose ObjectId.',
    }), 

    siteId: z.string({
      required_error: 'id is required in params.',
      invalid_type_error: 'id must be a mongoose object.',
    }).refine(value => mongoose.Types.ObjectId.isValid(value), {
      message: 'id must be a valid mongoose ObjectId.',
    }), 

    personIds: z.array(z.string()
      .refine(
        (value) => mongoose.Types.ObjectId.isValid(value),
        { message: 'id must be a valid mongoose ObjectId.' }
      ))
      .nonempty('At least one id is required.')
      .refine(
        (ids) => ids.every((id) => mongoose.Types.ObjectId.isValid(id)),
        { message: 'All ids must be valid mongoose ObjectIds.' }
      )
    }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






