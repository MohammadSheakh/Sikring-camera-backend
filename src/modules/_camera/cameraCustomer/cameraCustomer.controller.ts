import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../__Generic/generic.controller';
import { cameraCustomer } from './cameraCustomer.model';
import { IcameraCustomer } from './cameraCustomer.interface';
import { cameraCustomerService } from './cameraCustomer.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class cameraCustomerController extends GenericController<
  typeof cameraCustomer,
  IcameraCustomer
> {
  cameraCustomerService = new cameraCustomerService();

  constructor() {
    super(new cameraCustomerService(), 'cameraCustomer');
  }

  // add more methods here if needed or override the existing ones 
  
}
