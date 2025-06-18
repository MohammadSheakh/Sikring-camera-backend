import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { camera } from './camera.model';
import { Icamera } from './camera.interface';
import { cameraService } from './camera.service';
import { GenericController } from '../../__Generic/generic.controller';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class cameraController extends GenericController<
  typeof camera,
  Icamera
> {
  cameraService = new cameraService();

  constructor() {
    super(new cameraService(), 'camera');
  }

  // add more methods here if needed or override the existing ones 
  
}
