import colors from 'colors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app';
import { errorLogger, logger } from './shared/logger';
// import { socketHelper } from './helpers/socketForChat_V1_Rasel_Vai_Modified';
import { config } from './config';
import os from 'os';
import cluster from 'cluster';
import { createClient } from 'redis';
import socketIORedis from '@socket.io/redis-adapter';
import { initConversationCronJobs } from './modules/_chatting/conversation/conversation.cron';
import { initUserSubscriptionCron } from './modules/_subscription/userSubscription/userSubscription.cron';
import { initNotificationCron } from './modules/notification/notification.cron';
import { socketHelper } from './helpers/socketForChat_V2_Claude';
import http from "http";

// test 
// Number of CPU cores
const numCPUs = os.cpus().length;

// Global variable to store socket utilities
let socketUtils: any = null;

//uncaught exception
process.on('uncaughtException', error => {
  errorLogger.error('UnhandleException Detected', error);
  process.exit(1);
});

// if (cluster.isMaster) {
//   // Fork workers for each CPU core
//   logger.info(colors.green(`Master process started, forking ${numCPUs} workers...`));
  
//   // Fork workers for each core
//   for (let i = 0; i < numCPUs; i++) {
//     console.log("num of CPUs forking 🍴 numCPUs i", i);
//     cluster.fork();
//   }

//   // When a worker dies, log it and fork a new worker
//   cluster.on('exit', (worker, code, signal) => {
//     logger.error(`Worker ${worker.process.pid} died`);
//     cluster.fork();
//   });

// } else {
  let server: any;

  async function main() {
    try {
      await mongoose.connect(config.database.mongoUrl as string,{
        serverSelectionTimeoutMS: 30000,  // increase server selection timeout
        socketTimeoutMS: 45000,  // increase socket timeout
      });
      logger.info(colors.green('🚀 Database connected successfully'));
      const port =
        typeof config.port === 'number' ? config.port : Number(config.port);
      server = app.listen(port, config.backend.ip as string, () => {
        logger.info(
          colors.yellow(
            `♻️  Application listening on port ${config.backend.baseUrl}/v1`,
          ),
        );
      });

      // // Create Redis client for Pub/Sub
      // const pubClient = createClient({
      //   host: 'localhost',  // Update with your Redis configuration
      //   port: 6379, // 6379
      // });
      // const subClient = pubClient.duplicate();


      // --- SOCKET.IO ON DIFFERENT PORT ---
      const socketPort = 3000; // 👈 choose your socket port
      const socketServer = http.createServer(); // independent HTTP server only for socket.io


      //socket
      const io = new Server(/*server*/ socketServer, {
        // pingTimeout: 60000,
        // pingInterval: 25000,
        // upgradeTimeout: 30000,
        // maxHttpBufferSize: 1e6,
        cors: {
          origin: '*',
        },
        // Disable compression to avoid RSV1 issues
        //compression: true,
        //httpCompression: true,
        // Configure at engine level
        // engine: {
        //   compression: false,
        //   perMessageDeflate: false
        // },
        // perMessageDeflate: false,
         allowEIO4: true, // This can sometimes help with compatibility
         allowEIO3: true,
        // 
        transports: ['websocket', 'polling']
        /*
         * Bypass Cloudflare proxy (set DNS record to "DNS only", gray cloud)
         * Or use WebSocket-specific tunneling (like cloudflared)
         */
      });

      socketServer.listen(socketPort, config.backend.ip as string, () => {
        logger.info(colors.green(`🔌 Socket.IO listening on http://${config.backend.ip}:${socketPort}`));
      });


      // // Use Redis adapter for socket communication between workers
      // io.adapter(socketIORedis({ pubClient, subClient }));

      // Setup socket helper for chatting .. 
      
      socketUtils = socketHelper.socketForChat_V2_Claude(io);

      // Make socket utilities globally accessible
      global.socketUtils = socketUtils;

      // @ts-ignore
      global.io = io;
      // TODO : global.io is not a good practice, consider using a better approach to manage socket connections
    } catch (error) {
      errorLogger.error(colors.red('🤢 Failed to connect Database'));
    }

    //handle unhandledRejection
    process.on('unhandledRejection', error => {
      if (server) {
        server.close(() => {
          errorLogger.error('UnhandledRejection Detected', error);
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });
  }

  main();

  // ------ Cron Job .. 

  /*
  initConversationCronJobs();
  initUserSubscriptionCron();
  initNotificationCron();
  */


  //SIGTERM
  // process.on('SIGTERM', () => {
  //   logger.info('SIGTERM IS RECEIVE');
  //   if (server) {
  //     server.close();
  //   }
  // });

// }