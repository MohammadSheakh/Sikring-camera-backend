import { StatusCodes } from 'http-status-codes';
import { camera } from './camera.model';
import { Icamera } from './camera.interface';
import { GenericService } from '../../__Generic/generic.services';


export class cameraService extends GenericService<
  typeof camera,
  Icamera
> {
  constructor() {
    super(camera);
  }
}
