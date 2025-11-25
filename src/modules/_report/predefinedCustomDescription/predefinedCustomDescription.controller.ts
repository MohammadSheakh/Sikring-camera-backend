import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../__Generic/generic.controller';
import { PredefinedCustomDescription } from './predefinedCustomDescription.model';
import { IPredefinedCustomDescription } from './predefinedCustomDescription.interface';
import { PredefinedCustomDescriptionService } from './predefinedCustomDescription.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class PredefinedCustomDescriptionController extends GenericController<
  typeof PredefinedCustomDescription,
  IPredefinedCustomDescription
> {
  PredefinedCustomDescriptionService = new PredefinedCustomDescriptionService();

  constructor() {
    super(new PredefinedCustomDescriptionService(), 'PredefinedCustomDescription');
  }

  // add more methods here if needed or override the existing ones 
}
