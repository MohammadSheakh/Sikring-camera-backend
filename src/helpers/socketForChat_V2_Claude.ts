import colors from 'colors';
import { Server, Socket } from 'socket.io';
import { logger } from '../shared/logger';
import getUserDetailsFromToken from './getUesrDetailsFromToken';
import { Message } from '../modules/_chatting/message/message.model';
import { Conversation } from '../modules/_chatting/conversation/conversation.model';
import { handle } from 'i18next-http-middleware';
import { User } from '../modules/user/user.model';
import { ConversationParticipents } from '../modules/_chatting/conversationParticipents/conversationParticipents.model';
import { ConversationType } from '../modules/_chatting/conversation/conversation.constant';

declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}
/***********************
Key Changes Made:

Fixed parameter passing: Now properly passing all required parameters to handleUserDisconnection
Added multiple connection handling: Prevents same user from having multiple active connections
Fixed receiver logic: Corrected the logic for finding receiver in conversation participants
Added utility functions: Exposed helpful methods for checking online status
Better cleanup: Ensures all data structures are properly cleaned up on disconnection
Added better logging: More detailed connection/disconnection logs

Additional Benefits:

Memory leak prevention: Users are properly removed from all data structures
Duplicate connection handling: Automatically disconnects old connections when user connects from new device
Better error handling: More robust error handling throughout
Utility methods: Added helper functions to check online status and get socket IDs

The code now properly utilizes the data structures you mentioned and ensures clean connection management!

******************* */

// Types for better type safety
interface SocketUser {
  _id: string;
  name: string;
  // Add other user properties as needed
}

interface MessageData {
  conversationId: string;
  senderId: string;
  text: string;
  // Add other message properties as needed
}

interface ConversationData {
  creatorId: string;
  type: ConversationType.direct | ConversationType.group;
  groupName?: string;
  groupProfilePicture?: string;
  groupBio?: string;
  groupAdmins?: string[];
  blockedUsers?: string[];
  deletedFor?: string[];

  // lastMessage?: string; 
}

interface TypingData {
  conversationId: string;
  status: boolean;
  users: Array<{ _id: string }>;
}

// Helper function to emit errors
function emitError(socket: any, message: string, disconnect: boolean = false) {
  socket.emit('io-error', {
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
  if (disconnect) {
    socket.disconnect();
  }
}

async function getConversationById(conversationId: string) {
  try {
    const conversationData = await Conversation.findById(conversationId)//.populate('users').exec();  // FIXME: user populate korar bishoy ta 
    // FIXME : check korte hobe  
    
    const conversationParticipants = await ConversationParticipents.find({
      conversationId: conversationId
    });

    if (!conversationData) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }
    return { 
      conversationData: conversationData,
      conversationParticipants: conversationParticipants
    };
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
}

// Helper function to handle user disconnection
const handleUserDisconnection = (
  userId: string,
  socketId: string,
  onlineUsers: Set<string>,
  userSocketMap: Map<string, string>,
  socketUserMap: Map<string, string>,
  io: Server
) => {
  logger.info(colors.red(`🔌🔴 User disconnected: :userId: ${userId} :socketId: ${socketId}`));
  
  // Clean up all data structures
  onlineUsers.delete(userId);
  userSocketMap.delete(userId);
  socketUserMap.delete(socketId);
  
  // Emit updated online users list
  io.emit('online-users-updated', Array.from(onlineUsers));
};

const socketForChat_V2_Claude = (io: Server) => {
  // Better data structures for managing connections - MOVED INSIDE THE FUNCTION
  const onlineUsers = new Set<string>();
  const userSocketMap = new Map<string, string>(); // userId -> socketId
  const socketUserMap = new Map<string, string>(); // socketId -> userId

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.token as string;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const user = await getUserDetailsFromToken(token);
      // console.log("user from socketForChat_V2_Claude -> ", user);
      if (!user) {
        return next(new Error('Invalid authentication token'));
      }

      // Attach user to socket
      socket.data.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async(socket: Socket) => {
    const user = socket.data.user as SocketUser;
    const userId = user._id;

    logger.info(colors.blue(`🔌🟢 User connected: :userId🔌: ${userId} :userName🔌: ${user.name} :socketId⚡💡: ${socket.id}`));

    try {
      // Get user profile once at connection
      const userProfile = await User.findById(userId, 'name profileImage'); // TODO : profileImage userModel theke check korte hobe .. 
      socket.data.userProfile = userProfile;

      /***********
       * 
       *   Update Online Status - FIXED TO USE DATA STRUCTURES
       * 
       * ********** */

      // Handle multiple connections from same user
      const existingSocketId = userSocketMap.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        // Disconnect previous socket for this user
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect(true);
        }
        // Clean up old mapping
        socketUserMap.delete(existingSocketId);
      }

      // Update all data structures
      onlineUsers.add(userId);
      userSocketMap.set(userId, socket.id);
      socketUserMap.set(socket.id, userId);

      // Emit updated online users list
      io.emit('online-users-updated', Array.from(onlineUsers));

      // Join user to their personal room for direct notifications
      socket.join(userId);

      /***********
       * 
       *   Handle joining chat rooms  🟢working perfectly
       * 
       * ********** */  

      socket.on('join', async(conversationData: {conversationId: string}) => {
        if (!conversationData.conversationId) {
          return emitError(socket, 'conversationId is required');
        }
        
        console.log(`User ${user.name} joining chat ${conversationData.conversationId}`);
        
        // console.log(`Current userSocketMap: ${Array.from(userSocketMap.entries()).map(([k, v]) => `${k}:${v}`).join(', ')}`);
        // console.log(`Current socketUserMap: ${Array.from(socketUserMap.entries()).map(([k, v]) => `${k}:${v}`).join(', ')}`);
        // console.log(`------------------`);
        // console.log(roomSockets.map((s: any) => `${s.id} (${s.data.user.name})`).join(', '));

        socket.join(conversationData.conversationId);
        

        // Debug: Check room membership //------- from claude
        const roomSockets = await io.in(conversationData.conversationId).fetchSockets();
        console.log(`Room 💡 ${conversationData.conversationId} now has ${roomSockets.length} socket or user`); // 💡 how many users are joined in this conversation
        console.log(roomSockets.map((s: any) => `${s.id} (${s.data.user.name})`).join(', '));
        console.log(`--------------------- All current online users: ${Array.from(onlineUsers).join(', ')}`); // 💡 how many users are online 
        

        // Notify others in the chat
        socket.to(conversationData.conversationId).emit('user-joined-chat', {
          userId,
          userName: userProfile?.name || user.name,
          conversationId: conversationData.conversationId
        });


      });

      /***********
       * 
       *   Handle new messages  🟢working perfectly
       * 
       * ********** */

      socket.on('send-new-message', async (messageData: MessageData, callback) => {
        try {
          console.log('New message received:', messageData);

          if (!messageData.conversationId || !messageData.text?.trim()) {
            const error = 'Chat ID and message content are required';
            callback?.({ success: false, message: error });
            return emitError(socket, error);
          }

          // Get chat details
          const {conversationData, conversationParticipants} = await getConversationById(messageData.conversationId);
          
          // console.log('Conversation data:', conversationData);
          // console.log('Conversation participants:', conversationParticipants);


          /********
           * 
           * conversationData.canConversate jodi false hoy .. tahole ekta error send korbo je 
           * message kora jabe na .. 
           * 
           * ******** */

          if(conversationData.canConversate === false){
            const error = "You can't send messages in this conversation";
            callback?.({ success: false, message: error });
            return emitError(socket, error);
          }

          // Check if user is blocked
          if (conversationData.blockedUsers?.includes(userId)) {
            const error = "You have been blocked. You can't send messages.";
            callback?.({ success: false, message: error });
            return emitError(socket, error);
          }

          // Create message
          const newMessage = await Message.create({
            ...messageData,
            timestamp: new Date(),
            senderId: userId,
          });

          /**************************************

          // Update chat's last message and handle deletedFor logic
          let receiver: string | null = null;
          if (conversationParticipants.length === 2) {
            receiver = conversationParticipants.find((participant: any) => 
              participant.userId?.toString() !== userId
            )?.userId?.toString() || null;
          }

          let deletedFor = conversationData.deletedFor || [];
          if (receiver) {
            deletedFor = deletedFor.filter((id: any) => id.toString() !== receiver);
          }

          ****************************************/

          await Conversation.findByIdAndUpdate(messageData.conversationId, {
            lastMessage: newMessage._id,
          });

          // Prepare message data for emission
          const messageToEmit = {
            ...messageData,
            _id: newMessage._id,
            name: userProfile?.name || user.name,
            image: userProfile?.profileImage,
            createdAt: newMessage.createdAt || new Date()
          };

          // Emit to chat room
          const eventName = `new-message-received::${messageData.conversationId}`; // ${messageData.conversationId}
          

          console.log(`Emitting event: ${eventName}`, messageToEmit);
          /***************
          // Emit to recipient if online
          if (onlineUsers.has(to)) {
            const sockeId = onlineUsers.get(to);
            io?.to(to).emit('private-message', messageResult);
          }
          ********* */
          
          // when you send everyone include the sender//💡
          //io.to(messageData.conversationId).emit(eventName, messageToEmit);//💡
          
          // when you send everyone exclude the sender
          socket.to(messageData.conversationId).emit(eventName, messageToEmit);
          
          // socket.emit(eventName, messageToEmit);

          /// / Emit to sender's personal room 
          callback?.({
            success: true,
            message: "Message sent successfully",
            messageDetails: { 
              messageId : newMessage._id,
              conversationId: messageData.conversationId,
              senderId: userId,
              text: messageData.text,
              timestamp: newMessage.createdAt || new Date(),
              name: userProfile?.name || user.name,
              image: userProfile?.profileImage || null

            },
          });
          

        } catch (error) {
          console.error('Error sending message:', error);
          const errorMessage = 'Failed to send message';
          callback?.({ success: false, message: errorMessage });
          emitError(socket, errorMessage);
        }
      });

      /***********
       * 
       *   Handle chat blocking 
       * 
       * ********** */

      socket.on("isChatBlocked", (data: { conversationId: string; userId: string }, callback) => {
        try {
          if (!data.conversationId || !data.userId) {
            return callback?.({ success: false, message: 'Invalid data provided' });
          }

          const message = {
            success: true,
            message: 'Chat is blocked',
            data: data.conversationId,
            timestamp: new Date().toISOString()
          };

          callback?.(message);

          // Emit to specific user and chat
          io.emit(`needRefresh::${data.userId}`, {
            success: true,
            message: `User ${data.userId} needs refresh`
          });
          io.emit(`isChatBlocked::${data.conversationId}`, message);

        } catch (error) {
          console.error('Error handling conversation block:', error);
          callback?.({ success: false, message: 'Failed to block conversation' });
        }
      });

      /*************
       * 
       * Handle leaving conversation 🟢working perfectly 
       * 
       * ************* */
      socket.on('leave', async(conversationData: {conversationId: string}, callback) => {
        if (!conversationData.conversationId) {
          return callback?.({ success: false, message: 'conversationId is required' });
        }

        socket.leave(conversationData.conversationId);

        // Debug: Check room membership //------- from claude
        const roomSockets = await io.in(conversationData.conversationId).fetchSockets();
        console.log(`Room 💡 ${conversationData.conversationId} now has ${roomSockets.length} sockets or user`);
        console.log(roomSockets.map((s: any) => `${s.id} (${s.data.user.name})`).join(', '));
        
        // console.log(`--------------------- All current online users: ${Array.from(onlineUsers).join(', ')}`); // 💡 how many users are online 
        

        socket.to(conversationData.conversationId).emit(`user-left-conversation`, {
          userId,
          userName: userProfile?.name || user.name,
          conversationId: conversationData.conversationId,
          message: `${userProfile?.name || user.name} left the conversation`
        });

        callback?.({ success: true, message: 'Left conversation successfully' });
      });

      /*************
       * 
       * Handle read receipts
       * 
       * ************* */

      socket.on('read-all-messages', ({ conversationId, users, readByUserId }) => {
        if (!conversationId || !Array.isArray(users) || !readByUserId) {
          return emitError(socket, 'Invalid read receipt data');
        }

        users.forEach((targetUserId: string) => {
          if (targetUserId !== userId) { // Don't emit to sender
            io.to(targetUserId).emit('user-read-all-conversation-messages', {
              conversationId,
              readByUserId,
              timestamp: new Date().toISOString()
            });
          }
        });
      });

      /*************
       * 
       * Handle typing indicators // TODO : logic e jhamela ase .. 
       * 
       * ************* */
      socket.on('typing', (data: TypingData, callback) => {
        try {
          if (!data.conversationId || !Array.isArray(data.users)) {
            return callback?.({ success: false, message: 'Invalid typing data' });
          }

          const userName = userProfile?.name || user.name;
          const message = data.status ? `${userName} is typing...` : '';

          // Emit to other users in the conversation
          data.users.forEach((chatUser: any) => {
            if (chatUser._id !== userId) {
              io.to(chatUser._id).emit(`typing::${data.conversationId}`, {
                status: data.status,
                writeId: userId,
                message,
                timestamp: new Date().toISOString()
              });
            }
          });

          callback?.({
            success: true,
            writeId: userId,
            message,
            status: data.status
          });

        } catch (error) {
          console.error('Error handling typing indicator:', error);
          callback?.({ success: false, message: 'Failed to update typing status' });
        }
      });

      /*************
       * 
       * Handle user logout - FIXED TO PASS PARAMETERS
       * 
       * ************* */

      socket.on('logout', () => {
        handleUserDisconnection(userId, socket.id, onlineUsers, userSocketMap, socketUserMap, io);
      }); 

      /*************
       * 
       * Handle disconnection - FIXED TO PASS PARAMETERS
       * 
       * ************* */

      socket.on('disconnect', (reason) => {
        console.log(`User ${user.name} disconnected: ${reason}`);
        handleUserDisconnection(userId, socket.id, onlineUsers, userSocketMap, socketUserMap, io);
      });

    } catch(error) {
      console.error('Socket connection setup error:', error);
      emitError(socket, 'Connection setup failed', true);
    }
  });

  // Error handling for the server
  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  // UTILITY FUNCTION TO GET ONLINE USERS (OPTIONAL)
  const getOnlineUsers = () => Array.from(onlineUsers);
  const isUserOnline = (userId: string) => onlineUsers.has(userId);
  const getUserSocketId = (userId: string) => userSocketMap.get(userId);

  return { 
    io, 
    getOnlineUsers, 
    isUserOnline, 
    getUserSocketId 
  };
};

export const socketHelper = { socketForChat_V2_Claude };