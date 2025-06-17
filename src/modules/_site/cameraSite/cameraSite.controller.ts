import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../__Generic/generic.controller';
import { cameraSite } from './cameraSite.model';
import { IcameraSite } from './cameraSite.interface';
import { cameraSiteService } from './cameraSite.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class cameraSiteController extends GenericController<
  typeof cameraSite,
  IcameraSite
> {
  cameraSiteService = new cameraSiteService();

  constructor() {
    super(new cameraSiteService(), 'cameraSite');
  }

  // add more methods here if needed or override the existing ones 
  
}
