import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../__Generic/generic.controller';
import { cameraSite } from './cameraSite.model';
import { IcameraSite } from './cameraSite.interface';
import { CameraSiteService } from './cameraSite.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class cameraSiteController extends GenericController<
  typeof cameraSite,
  IcameraSite
> {
  cameraSiteService = new CameraSiteService();

  constructor() {
    super(new CameraSiteService(), 'cameraSite');
  }

  // add more methods here if needed or override the existing ones 
  
}
