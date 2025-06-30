
import { GenericController } from '../../__Generic/generic.controller';
import { ICameraPerson } from './cameraPerson.interface';
import { CameraPerson } from './cameraPerson.model';
import { CameraPersonService } from './cameraPerson.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class CameraPersonController extends GenericController<
  typeof CameraPerson,
  ICameraPerson
> {
  CameraPersonService = new CameraPersonService();

  constructor() {
    super(new CameraPersonService(), 'CameraPerson');
  }

  // add more methods here if needed or override the existing ones 
  
}
