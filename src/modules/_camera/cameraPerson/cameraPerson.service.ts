import { GenericService } from '../../__Generic/generic.services';
import { ICameraPerson } from './cameraPerson.interface';
import { CameraPerson } from './cameraPerson.model';

export class CameraPersonService extends GenericService<
  typeof CameraPerson,
  ICameraPerson
> {
  constructor() {
    super(CameraPerson);
  }
}
