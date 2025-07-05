import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { camera } from './camera.model';
import { Icamera } from './camera.interface';
import { cameraService } from './camera.service';
import { GenericController } from '../../__Generic/generic.controller';
import sendResponse from '../../../shared/sendResponse';
import { CameraSiteService } from '../../_site/cameraSite/cameraSite.service';
import catchAsync from '../../../shared/catchAsync';
import { IauditLog } from '../../auditLog/auditLog.interface';
import { TStatus } from '../../auditLog/auditLog.constant';
import eventEmitterForAuditLog from '../../auditLog/auditLog.service';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { CameraPerson } from '../cameraPerson/cameraPerson.model';
import { Site } from '../../_site/site/site.model';
import { userSite } from '../../_site/userSite/userSite.model';
import { IuserSite } from '../../_site/userSite/userSite.interface';
import { cameraSite } from '../../_site/cameraSite/cameraSite.model';
import mongoose from 'mongoose';

// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class cameraController extends GenericController<
  typeof camera,
  Icamera
> {
  cameraService = new cameraService();
  cameraSiteService = new CameraSiteService();

  constructor() {
    super(new cameraService(), 'camera');
  }

    /*************
     * 
     *  // TODO :  Must Need to implement mongodb transaction here
     * 
     * *********** */
    create = catchAsync(async (req: Request, res: Response) => {
      
      // Start a session for MongoDB transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      // TODO : req.body te siteId and siteName nite hobe abu sayeed vai er kas theke .. 
      // INFO :  karon shei nam ta audit log e dekhano lagbe .. 

      // TODO :  check korte hobe thik ase kina 

      let payload = {
          localLocation: req.body.localLocation,
          cameraName: req.body.cameraName,
          cameraUsername : req.body.cameraUsername,
          cameraPassword: req.body.cameraPassword,  
          cameraIp: req.body.cameraIp || '',
          cameraPort: req.body.cameraPort, 
          cameraPath: req.body.cameraPath || '',
          // ${req.body.cameraPort ?? ''}
          //  cameraPath er age must ekta / thakbe .. 
          rtspUrl: `rtsp://${req.body.cameraUsername}:${req.body.cameraPassword}@${req.body.cameraIp.replace("http://", "")}${req.body.cameraPath}`,
          ...(req.body.globalLocation && { globalLocation: req.body.globalLocation }),
          ...(req.body.lat && { lat: req.body.lat }),
          ...(req.body.long && { long: req.body.long }),
        };

      /*
       * const result = await this.service.create(payload);
       */

      //const result = await camera.create(payload)
      const result = await camera.create([payload], { session })  // updated with the session for transaction
      
      /*******
      {
          // siteName: req.body.siteName,
          localLocation: req.body.localLocation,
          cameraName: req.body.cameraName,
          cameraUsername : req.body.cameraUsername,
          cameraPassword: req.body.cameraPassword,
          cameraIp: req.body.cameraIp || '',
          cameraPort: req.body.cameraPort, 
      }
      ******* */

      let actionPerformed = `Create a new camera ${result[0]._id} | `;

      if(req.body.siteId && result[0]._id){

        const assignCameraForSite = await cameraSite.create([
          {
            cameraId: result[0]._id,
            siteId: req.body.siteId,
          }
        ], { session });

        /************
         * 
         * as we got the siteId .. that means .. site has already a manager Id .. 
         * so, lets assign the camera to that manager .. 
         * 
         * *********** */

        // Manager For Site 
        const managerIdForSite : IuserSite | null = await userSite.findOne({
          siteId: req.body.siteId,
          role: 'manager',
        }).select('personId role').session(session);

        if(managerIdForSite && managerIdForSite.personId){
          await CameraPerson.create([{
            cameraId: result[0]._id,
            personId : managerIdForSite?.personId,
            siteId : req.body.siteId,
            status: 'enable', // default status
            role: managerIdForSite?.role, // default role if not specified
          }], { session });
        }

        actionPerformed+= `Provide View Access ${result[0]._id} for ${managerIdForSite?.personId} ${managerIdForSite?.role} | `;

        actionPerformed+= `Assign a camera ${result[0]._id} for ${req.body.siteName}`;
      }

      // Commit the transaction
      await session.commitTransaction();
      
      let valueForAuditLog : IauditLog = {
        userId: req.user.userId,
        role: req.user.role,
        actionPerformed: `${actionPerformed}`,
        status: TStatus.success,
      }

      eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);
      
      // End the session
      session.endSession();

      sendResponse(res, {
        code: StatusCodes.OK,
        data: result,
        message: `${this.modelName} created successfully`,
        success: true,
      });
    });

    getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const populateOptions: (string | {path: string, select: string}[]) = [];

    const dontWantToInclude = '-localLocation -attachments -cameraPassword -cameraIp -cameraPort -isDeleted -createdAt -updatedAt -__v'; // -role
    
    const result = await this.service.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
  
}
