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

    create = catchAsync(async (req: Request, res: Response) => {
    
      // console.log('req.body 🧪🧪🧪', req.body);
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
          rtspUrl: `rtsp://${req.body.cameraUsername}:${req.body.cameraPassword}@${req.body.cameraIp.replace("http://", "")}:${req.body.cameraPort}/stream`
      };

      if(req.body.globalLocation){
        payload = {
          ...payload,
          globalLocation: req.body.globalLocation,
        }
      }
      if(req.body.lat){
        payload = {
          ...payload,
          lat: req.body.lat,
        }
      }
      if(req.body.long){
        payload = {
          ...payload,
          long: req.body.long,
        }
      }
      

      const result = await this.service.create(payload);
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

      let actionPerformed = '';

      if(req.body.siteId && result._id){

        // need to check if the manager exist or not  

        const assignCameraForSite = await this.cameraSiteService.create({
          cameraId: result._id,
          siteId:  req.body.siteId,
        });

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
        }).select('personId role');

        if(managerIdForSite && managerIdForSite.personId){
          await CameraPerson.create({
            cameraId: result._id,
            personId : managerIdForSite?.personId
          })
        }

        // TODO : better hoito jodi manager er nam dekhano jaito .. 
        actionPerformed+= `Provide View Access ${result._id} for ${managerIdForSite?.personId} ${managerIdForSite?.role}`;

        actionPerformed+= `Assign a camera ${result._id} for ${req.body.siteName}`;
      }
      
      let valueForAuditLog : IauditLog = {
        userId: req.user.userId,
        role: req.user.role,
        actionPerformed: `${actionPerformed}`,
        status: TStatus.success,
      }

      eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);
      
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
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      // {
      //   path: 'userId',
      //   select: 'name email'
      // },
      // 'personId'
      // {
      //   path: 'personId',
      //   select: 'name email phoneNumber'
      // }
    ];

    // const dontWantToInclude = ['-localLocation -attachments']; // -role

    const dontWantToInclude = '-localLocation -attachments -cameraPassword -cameraIp -cameraPort -isDeleted -createdAt -updatedAt -__v'; // -role
    // -localLocation -attachments 

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
