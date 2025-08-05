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
import eventEmitForCheckCameraRTSPURL from './camera.service';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { CameraPerson } from '../cameraPerson/cameraPerson.model';
import { Site } from '../../_site/site/site.model';
import { userSite } from '../../_site/userSite/userSite.model';
import { IuserSite } from '../../_site/userSite/userSite.interface';
import { cameraSite } from '../../_site/cameraSite/cameraSite.model';
import mongoose from 'mongoose';
import { addViewer, getViewerCount, removeViewer } from './viewerTracker.utils';
import { hasViewers } from './viewerTracker.utils';
import { getActiveViewers } from './viewerTracker.utils';
import { config } from '../../../config';

const { spawn, ChildProcess } = require('child_process');
const path = require('path');
const fs = require('fs');

// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

// 🔥 Global store for active FFmpeg processes
const activeStreams: { [cameraId: string]: ChildProcess } = {};

export class cameraController extends GenericController<
  typeof camera,
  Icamera
> {
  cameraService = new cameraService();
  cameraSiteService = new CameraSiteService();

  constructor() {
    super(new cameraService(), 'camera');
  }

/***********************************  START START  
  startStreaming = catchAsync(async (req: Request, res: Response) => {
  const cameraId = req.params.cameraId;
  const camera = await this.cameraService.getById(cameraId);
  
  if (!camera) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Camera not found',
      success: false,
    });
  }

  // Check if stream is already running
  if (activeStreams[cameraId]) {
    return res.json({
      message: 'Stream already running',
      hlsUrl: `${config.backend.shobHoyUrl}/hls/${cameraId}.m3u8`, 
      // ${config.backend.shobHoyUrl} //  ${config.backend.ip}
      status: 'success'
    });
  }

  console.log('Starting streaming for camera: 🟢🟢🟢', camera);

  const rtspUrl = camera.rtspUrl;

  // Directory to store HLS segments
  const hlsDir = path.join(__dirname, '..', '..', 'public', 'hls'); // Fixed path
  if (!fs.existsSync(hlsDir)) {
    fs.mkdirSync(hlsDir, { recursive: true });
  }

  const outputPath = path.join(hlsDir, `${cameraId}.m3u8`);

  // Clear old HLS files
  try {
    fs.readdirSync(hlsDir)
      .filter(f => f.startsWith(`${cameraId}_`) || f === `${cameraId}.m3u8`)
      .forEach(f => {
        try {
          fs.unlinkSync(path.join(hlsDir, f));
        } catch (err) {
          console.warn(`Failed to delete file ${f}:`, err);
        }
      });
  } catch (err) {
    console.warn('Failed to clean old HLS files:', err);
  }

  // FFmpeg command to convert RTSP → HLS
  const ffmpeg = spawn('ffmpeg', [
    
    // Input settings
    '-rtsp_transport', 'tcp',
    '-allowed_media_types', 'video+audio',
    '-rtsp_flags', 'prefer_tcp',
    '-buffer_size', '1024000',
    '-max_delay', '500000',
    '-fflags', '+genpts',
    '-avoid_negative_ts', 'make_zero',
    '-i', rtspUrl,
    
    // Video encoding
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-profile:v', 'baseline',
    '-level', '3.0',
    '-b:v', '1000k',
    '-maxrate', '1200k',
    '-bufsize', '2000k',
    '-g', '60', // Keyframe interval
    '-sc_threshold', '0',
    '-pix_fmt', 'yuv420p',
    
    // Audio encoding
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '48000',
    '-ac', '2',
    
    // HLS settings
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments+append_list',
    '-hls_segment_filename', path.join(hlsDir, `${cameraId}_%d.ts`),
    '-hls_segment_type', 'mpegts',
    '-start_number', '0',
    '-y',
    outputPath
  ]);

  // Handle FFmpeg output
  ffmpeg.stdout.on('data', (data) => {
    console.log(`FFmpeg stdout [${cameraId}]: ${data}`);
  });

  ffmpeg.stderr.on('data', (data) => {
    const output = data.toString();
    console.error(`FFmpeg stderr [${cameraId}]: ${output}`);
    
    // Parse progress for monitoring
    const frameMatch = output.match(/frame=\s*(\d+)/);
    if (frameMatch) {
      console.log(`Camera ${cameraId} - Processed frames: ${frameMatch[1]}`);
    }
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg for camera ${cameraId} exited with code ${code}`);
    // Clean up the active stream reference
    if (activeStreams[cameraId]) {
      delete activeStreams[cameraId];
    }
  });

  ffmpeg.on('error', (err) => {
    console.error(`FFmpeg error for camera ${cameraId}:`, err);
    // Clean up the active stream reference
    if (activeStreams[cameraId]) {
      delete activeStreams[cameraId];
    }
  });

  // Store ffmpeg process
  activeStreams[cameraId] = ffmpeg;

  // Wait a moment to ensure FFmpeg starts properly
  setTimeout(() => {
    // Check if the process is still running
    if (activeStreams[cameraId] && !activeStreams[cameraId].killed) {
      // Return HLS URL
      res.json({
        message: 'Streaming started',
        hlsUrl: `${config.backend.shobHoyUrl}/hls/${cameraId}.m3u8`, // shobHoyUrl // config.backend.ip
        status: 'success'
      });
    } else {
      res.status(500).json({
        error: 'Failed to start streaming',
        message: 'FFmpeg process failed to start'
      });
    }
  }, 2000);
});

************************************** START END  ***/

/***********************************  startStreamingV222222 START  
startStreamingV222222 = catchAsync(async (req: Request, res: Response) => {
  const cameraId = req.params.cameraId;
  const camera = await this.cameraService.getById(cameraId);
  
  if (!camera) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Camera not found',
      success: false,
    });
  }

  // Check if stream is already running
  if (activeStreams[cameraId]) {
    return res.json({
      message: 'Stream already running',
      hlsUrl: `${config.backend.shobHoyUrl}/hls/${cameraId}.m3u8`,
      status: 'success'
    });
  }

  const rtspUrl = camera.rtspUrl;
  const hlsDir = path.join(__dirname, '..', '..', 'public', 'hls');
  
  if (!fs.existsSync(hlsDir)) {
    fs.mkdirSync(hlsDir, { recursive: true });
  }

  const outputPath = path.join(hlsDir, `${cameraId}.m3u8`);

  // Clear old files
  try {
    fs.readdirSync(hlsDir)
      .filter(f => f.startsWith(`${cameraId}_`) || f === `${cameraId}.m3u8`)
      .forEach(f => fs.unlinkSync(path.join(hlsDir, f)));
  } catch (err) {}

  // Fixed FFmpeg command
  const ffmpeg = spawn('ffmpeg', [
  
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-g', '30',
    '-c:a', 'aac',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_list_size', '0', // Retain 15 segments (60 seconds of footage)
    '-hls_flags', 'append_list', // Key fix: Avoid deleting old segments prematurely
    //////////// +omit_endlist
    '-hls_segment_filename', path.join(hlsDir, `${cameraId}_%d.ts`),
    '-y',

    outputPath
  ]);

  ffmpeg.stderr.on('data', (data) => {
    console.log(`FFmpeg [${cameraId}]: ${data}`);
  });

  setInterval(() => {
  console.log(`➿ [${cameraId}] Stream is running:`, !!activeStreams[cameraId]);
  }, 5000);


  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg closed with code ${code}`);
    delete activeStreams[cameraId];
  });

  activeStreams[cameraId] = ffmpeg;

  setTimeout(() => {
    if (activeStreams[cameraId] && !activeStreams[cameraId].killed) {
      res.json({
        message: 'Streaming started',
        hlsUrl: `${config.backend.shobHoyUrl}/hls/${cameraId}.m3u8`,
        status: 'success'
      });
    } else {
      res.status(500).json({
        error: 'Failed to start streaming'
      });
    }
  }, 3000);
});
************************************** START END  ***/

/*********
 * 
 * With The help of bipul vai .. this is working fine ..
 * 
 * ********* */
startStreamingBipulVai = catchAsync(async (req: Request, res: Response) => {
  const cameraId = req.params.cameraId;
  const camera = await this.cameraService.getById(cameraId);
  
  if (!camera) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Camera not found',
      success: false,
    });
  }

  addViewer(cameraId, req.user.userId.toString());

  // Check if stream is already running 🟢
  if (activeStreams[cameraId]) {

    return res.json({
      message: 'Stream already running',
      hlsUrl: `${config.backend.shobHoyUrl}/hls/${cameraId}.m3u8`,
      viewerCount: getViewerCount(cameraId),
      status: 'success'
    });
  }

  const rtspUrl = camera.rtspUrl;

  // Create HLS directory with proper path
  const hlsDir = path.join(__dirname, '..', '..', '..', '..', 'public', 'hls');
  if (!fs.existsSync(hlsDir)) {
    fs.mkdirSync(hlsDir, { recursive: true });
  }

  // Create camera-specific output path
  const outputPath = path.join(hlsDir, `${cameraId}.m3u8`);

  const ffmpeg = spawn('ffmpeg', [
    // Input options to better handle problematic streams
    '-analyzeduration', '10000000', // Increase analyze duration
    '-probesize', '10000000', // Increase probe size
    '-rtsp_transport', 'tcp', // Use TCP for more reliable RTSP
    '-i', rtspUrl,
    
    // Video encoding options
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-r', '25', // Set frame rate
    '-s', '1280x720', // Set resolution (adjust as needed)
    '-pix_fmt', 'yuv420p', // Set pixel format
    
    // Audio encoding options
    '-c:a', 'aac',
    '-ar', '48000', // Set audio sample rate
    '-ac', '2', // Set audio channels
    
    // HLS options
    '-hls_time', '2',
    '-hls_list_size', '3',
    '-hls_flags', 'delete_segments',
    '-hls_segment_filename', path.join(hlsDir, `${cameraId}_%03d.ts`),
    
    // Force format and handle errors
    '-f', 'hls',
    '-avoid_negative_ts', 'make_zero',
    '-fflags', '+genpts',
    
    outputPath
  ]);


  // Store the ffmpeg process with camera ID as key
   activeStreams[cameraId] = ffmpeg; // 🟢
   addViewer(cameraId, req.user.userId.toString());

  ffmpeg.stdout.on('data', (data) => {
    console.log(`FFmpeg stdout [${cameraId}]: 🟢🟢🟢 ${data}`);
  });

  ffmpeg.stderr.on('data', (data) => {
    console.log(`FFmpeg stderr [${cameraId}]: 🔴🔴🔴 ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg [${cameraId}] 🟢🟢🟢 process exited with code ${code}`);
    // Clean up activeStreams if you're using it
    // delete activeStreams[cameraId];
    // Restart FFmpeg if it crashes
    // setTimeout(() => startFFmpeg(cameraId), 5000);
  });

  ffmpeg.on('error', (err) => {
    console.error(`FFmpeg [${cameraId}] error: 🔴🔴🔴`, err);
    // delete activeStreams[cameraId];
  });

  res.json({
    message: 'Streaming started',
    hlsUrl: `${config.backend.shobHoyUrl}/hls/${cameraId}.m3u8`,
    viewerCount: getViewerCount(cameraId),
    status: 'success'
  });  
});


  stopStreamingV2 = catchAsync(async (req: Request, res: Response) => {
    const cameraId = req.params.cameraId;
    const ffmpeg = activeStreams[cameraId];

    removeViewer(cameraId, req.user.userId.toString());

    console.log('🚧', getViewerCount(cameraId), "🚧", typeof getViewerCount(cameraId)); 
    
    // ffmpeg &&

    console.log("😵😵💎💎", getViewerCount(cameraId))
    
    if (getViewerCount(cameraId) < 1) {
      if(ffmpeg){
        ffmpeg.kill();
        delete activeStreams[cameraId];
        res.json({ message: 'Streaming stopped', viewerCount: getViewerCount(cameraId) });
      }
      delete activeStreams[cameraId];
      res.json({ message: 'No stream found to stop', viewerCount: getViewerCount(cameraId) });
    }else if ( getViewerCount(cameraId) > 1 ) {
      removeViewer(cameraId, req.user.userId.toString());
      res.json({ message: 'One Viewer Removed', viewerCount: getViewerCount(cameraId) });
    }else {
      res.status(404).json({ error: 'Has Multiple Viewers ... ', viewerCount: getViewerCount(cameraId) });
    }
  });

  getStreamingStatus = catchAsync(async (req: Request, res: Response) => {
    const cameraId = req.params.cameraId;
    const ffmpeg = activeStreams[cameraId];
    const isStreaming = !!ffmpeg;
    const viewerCount = getViewerCount(cameraId);
    const activeViewersList = hasViewers(cameraId) ? getActiveViewers(cameraId) : [];

    res.json({
      isStreaming,
      viewerCount,
      activeViewers: activeViewersList,
      message: isStreaming ? 'Camera is currently streaming' : 'Camera is not streaming',
    });
  });

    /*************
     * 
     *  // This is working fine .. but we need to check the rtsp url which is provided by the user .. that is working or not .. 
     *  so, for that we have to check that rtsp url in background .. 
     * 
     *  with this functionality we should create a updated function ..  📁 createV2
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
          isDeleted: false,
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

    /**********
     * 
     *  here we implement the rtsp url checking functionality .. 
     *  we will check the rtsp url in background ..
     * 
     * ******** */
    createV2 = catchAsync(async (req: Request, res: Response) => {
      
      // Start a session for MongoDB transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      let payload = {
          localLocation: req.body.localLocation,
          cameraName: req.body.cameraName,
          cameraUsername : req.body.cameraUsername,
          cameraPassword: req.body.cameraPassword,  
          cameraIp: req.body.cameraIp || '',
          cameraPort: req.body.cameraPort, 
          cameraPath: req.body.cameraPath || '',
          rtspUrl: `rtsp://${req.body.cameraUsername}:${req.body.cameraPassword}@${req.body.cameraIp.replace("http://", "")}${req.body.cameraPath}`,
          ...(req.body.globalLocation && { globalLocation: req.body.globalLocation }),
          ...(req.body.lat && { lat: req.body.lat }),
          ...(req.body.long && { long: req.body.long }),
        };

      //const result = await camera.create(payload)
      const result = await camera.create([payload], { session })  // updated with the session for transaction
      
      /********
       * 
       * lets call event emitter to check the rtsp url in background ..
       * 
       * ******* */

      console.log('⚡⚡⚡⚡⚡')
      eventEmitForCheckCameraRTSPURL.emit('eventEmitForCheckCameraRTSPURL', {
        /********
         *  we need to pass cameraId .. as if url is not valid then we have to update the camera status .. 
         * ***** */
        cameraId: result[0]._id,
        rtspUrl: result[0].rtspUrl,
      });

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
          
          isDeleted: false,
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
