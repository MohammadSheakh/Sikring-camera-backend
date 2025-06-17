import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../__Generic/generic.controller';
import { site } from './site.model';
import { Isite } from './site.interface';
import { siteService } from './site.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class siteController extends GenericController<
  typeof site,
  Isite
> {
  siteService = new siteService();

  constructor() {
    super(new siteService(), 'site');
  }

  // add more methods here if needed or override the existing ones 
  
}
