import { StatusCodes } from 'http-status-codes';
import { camera } from './camera.model';
import { Icamera } from './camera.interface';
import { GenericService } from '../../__Generic/generic.services';
import EventEmitter from 'events';
import Stream from 'node-rtsp-stream';

const eventEmitForCheckCameraRTSPURL = new EventEmitter(); // functional way

eventEmitForCheckCameraRTSPURL.on('eventEmitForCheckCameraRTSPURL', (rtspUrl: any, cameraId: any) => {
  
  let timeoutMs = 10000; // 5 seconds timeout
  
    
    let hasResolved = false;
    
    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        // resolve(false);
      }
    }, timeoutMs);

    try {
      const stream = new Stream({
        name: 'test-stream',
        streamUrl: rtspUrl,
        wsPort: 0, // Use random port for testing
        ffmpegOptions: {
          '-stats': '',
          '-r': 1 // Low frame rate for testing
        }
      });

      stream.on('camdata', () => {
        if (!hasResolved) {
          hasResolved = true;
          
          clearTimeout(timeout);
          stream.stop();
          // resolve(true);
        }
      });

      stream.on('error', (err) => {
        if (!hasResolved) {
          hasResolved = true;
          
          clearTimeout(timeout);
          console.error('RTSP stream error:', err.message);
          // resolve(false);
        }
      });

    } catch (error) {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeout);
        // resolve(false);
      }
    }
  });

  ///////////////////////////////
    


export default eventEmitForCheckCameraRTSPURL;

export class cameraService extends GenericService<
  typeof camera,
  Icamera
> {
  constructor() {
    super(camera);
  }
}
