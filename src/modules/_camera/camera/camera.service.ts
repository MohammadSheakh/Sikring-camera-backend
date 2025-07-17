import { StatusCodes } from 'http-status-codes';
import { camera } from './camera.model';
import { Icamera } from './camera.interface';
import { GenericService } from '../../__Generic/generic.services';
import EventEmitter from 'events';

const eventEmitForCheckCameraRTSPURL = new EventEmitter(); // functional way

eventEmitForCheckCameraRTSPURL.on('eventEmitForCheckCameraRTSPURL', (valueFromRequest: any) => {
  try {
      
    }catch (error) {
     
    }
  
});

export default eventEmitForCheckCameraRTSPURL;

export class cameraService extends GenericService<
  typeof camera,
  Icamera
> {
  constructor() {
    super(camera);
  }
}
