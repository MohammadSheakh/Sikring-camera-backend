import { z } from 'zod';

const ObjectIdRegex = /^[0-9a-fA-F]{24}$/; // Regular expression to check for valid ObjectId

export const createCameraValidationSchema = z.object({
  body: z.object({
    cameraName: z  
    .string({
        required_error: 'cameraName is required, cameraName must be a string.',
        invalid_type_error: 'cameraName must be a string.',
      }).min(3, {
      message: 'cameraName must be at least 3 characters long.',
    }).max(200, {
      message: 'cameraName must be at most 200 characters long.',
    }),

    siteName: z  
    .string({
        required_error: 'siteName is required, siteName must be a string.',
        invalid_type_error: 'dateOfBirth must be a string.',
      }).min(5, {
      message: 'siteName must be at least 5 characters long.',
    }).max(500, {
      message: 'siteName must be at most 500 characters long.',
    }),
  
    // siteId is important for camera site relation .. 
    siteId: z.string({
        required_error: 'siteId is required, siteId must be a valid mongoose object id .',
        invalid_type_error: 'siteId must be a string.',
      }).refine(value => ObjectIdRegex.test(value), {
      message: 'Invalid siteId format. Must be a valid ObjectId.',
    }),

    cameraIp: z  
    .string({
        required_error: 'cameraIp is required, cameraIp must be a string.',
        invalid_type_error: 'cameraIp must be a string.',   
      }).min(6, {
      message: 'cameraIp must be at least 6 characters long.',
    }).max(100, {
      message: 'cameraIp must be at most 100 characters long.',
    }),

    cameraPassword: z  
    .string({
        required_error: 'cameraPassword is required, cameraPassword must be a string.',
        invalid_type_error: 'cameraPassword must be a string.',   
      }).min(6, {
      message: 'cameraPassword must be at least 6 characters long.',
    }).max(100, {
      message: 'cameraPassword must be at most 100 characters long.',
    }),

    localLocation: z
    .string({
        required_error: 'localLocation is required, localLocation must be a string.',
        invalid_type_error: 'localLocation must be a string.',
      }).min(5, {
      message: 'localLocation must be at least 5 characters long.',
    }).max(500, {
      message: 'localLocation must be at most 500 characters long.',
    }),
    
    
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






