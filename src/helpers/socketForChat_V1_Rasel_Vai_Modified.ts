import colors from 'colors';
import { Server, Socket } from 'socket.io';
import { logger } from '../shared/logger';
import getUserDetailsFromToken from './getUesrDetailsFromToken';
import { Message } from '../modules/_chatting/message/message.model';
import { Conversation } from '../modules/_chatting/conversation/conversation.model';
import { handle } from 'i18next-http-middleware';
import { User } from '../modules/user/user.model';
import { ConversationParticipents } from '../modules/_chatting/conversationParticipents/conversationParticipents.model';

declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}
/***********************
const socketForChat = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(colors.blue('🔌🟢 A user connected'));
    socket.on('user-connected', (userId: string) => {
      socket.userId = userId;
      socket.join(userId); // Join the room for the specific user
      logger.info(
        colors.green(`User ${userId} joined their notification room`)
      );
    });

    // Join a room for a specific conversation
    socket.on('joinRoom', (conversationId) => {
      console.log(`User joined room: ${conversationId}`);
      socket.join(conversationId);  // Join a room based on conversationId
    });

    // Leave a room when a user disconnects or leaves
    socket.on('leaveRoom', (conversationId) => {
      console.log(`User left room: ${conversationId}`);
      socket.leave(conversationId);
    });

    socket.on('disconnect', () => {
      logger.info(colors.red('🔌🔴 A user disconnected'));
    });
  });
};

******************* */

// Types for better type safety
interface SocketUser {
  _id: string;
  name: string;
  // Add other user properties as needed
}

interface MessageData {
  chat: string;
  sender: string;
  content: string;
  // Add other message properties as needed
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
    const conversationData = await Conversation.findById(conversationId).populate('users').exec();
    
  
    const conversationParticipants = await ConversationParticipents.find({
      conversationId: conversationId
    })

    if (!conversationData) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }
    return { 
      conversationData: conversationData,
      conversationParticipants : conversationParticipants
    };
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error; // Rethrow to handle it in the calling function
  }
}

const socketForChat = (io: Server) => {
  // io.on('connection', (socket: Socket) => {
    
  // });

  // Better data structures for managing connections
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

    logger.info(colors.blue(`🔌🟢 User connected: :userId: ${userId} :userName: ${user.name} :socketId: ${socket.id}`));

    try{
      // get user profile once at connection // 🔴 i dont need user profile here 
      //const userProfile = await getUserProfile(userId);
      // TODO : test korte hobe userProfile get kora lagbe kina .. 
      const userProfile = await User.findById(userId, 'name image'); // Fetch only necessary fields
      socket.data.userProfile = userProfile;

      /***********
       * 
       *   Update Online Status 
       * 
       * ********** */

      onlineUsers.add(userId);
      userSocketMap.set(userId, socket.id);
      socketUserMap.set(socket.id, userId);

      // Emit updated online users list
      io.emit('online-users-updated', Array.from(onlineUsers));

      // Join user to their personal room for direct notifications
      socket.join(userId);


      /***********
       * 
       *   Handle joining chat rooms
       * 
       * ********** */

      socket.on('join', (conversationId: string) => {
        if (!conversationId) {
          return emitError(socket, 'Chat ID is required');
        }
        
        console.log(`User ${user.name} joining chat ${conversationId}`);
        socket.join(conversationId);
        
        // Notify others in the chat
        socket.to(conversationId).emit('user-joined-chat', {
          userId,
          userName: userProfile?.name || user.name,
          conversationId
        });
      });

      /***********
       * 
       *   Handle new messages
       * 
       * ********** */

      socket.on('send-new-message', async (messageData: MessageData, callback) => {
        try {
          console.log('New message received:', messageData);

          if (!messageData.chat || !messageData.content?.trim()) {
            const error = 'Chat ID and message content are required';
            callback?.({ success: false, message: error });
            return emitError(socket, error);
          }

          // Get chat details
          const {conversationData, conversationParticipants} = await getConversationById(messageData.chat); // FIX ME : ekhane thik jinish send kora hoy nai 
          
          // Check if user is blocked
          if (conversationData.blockedUsers?.includes(userId)) {
            const error = "You have been blocked. You can't send messages.";
            callback?.({ success: false, message: error });
            return emitError(socket, error);
          }

          // Create message
          const newMessage = await Message.create({
            ...messageData,
            sender: userId,
            timestamp: new Date()
          });

          // Update chat's last message and handle deletedFor logic
          let receiver: string | null = null;
          if (conversationParticipants.length === 2) {
            receiver = conversationParticipants.find((u: any) => 
              // TODO : ekhane logic fix korte hobe 
              // FIX ME : ekhane logic fix korte hobe ..  
              u._id.toString() !== userId
            )?._id.toString() || null;
          }

          let deletedFor = conversationData.deletedFor || [];
          if (receiver) {
            deletedFor = deletedFor.filter(id => id.toString() !== receiver);
          }

          await Conversation.findByIdAndUpdate(messageData.chat, {
            lastMessage: newMessage._id,
            deletedFor,
            updatedAt: new Date()
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
          const eventName = `new-message-received::${messageData.chat}`;
          socket.to(messageData.chat).emit(eventName, messageToEmit);
          socket.emit(eventName, messageToEmit);

          callback?.({
            success: true,
            message: "Message sent successfully",
            messageId: newMessage._id
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
       *   Handle chat bloking 
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
          console.error('Error handling chat block:', error);
          callback?.({ success: false, message: 'Failed to block chat' });
        }
      });

      /*************
       * 
       * Handle leaving chat
       * 
       * ************* */
      socket.on('leave', (conversationId: string, callback) => {
        if (!conversationId) {
          return callback?.({ success: false, message: 'Chat ID is required' });
        }

        socket.leave(conversationId);
        socket.to(conversationId).emit(`user-left-chat`, {
          userId,
          userName: userProfile?.name || user.name,
          conversationId,
          message: `${userProfile?.name || user.name} left the chat`
        });

        callback?.({ success: true, message: 'Left chat successfully' });
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
            io.to(targetUserId).emit('user-read-all-chat-messages', {
              conversationId,
              readByUserId,
              timestamp: new Date().toISOString()
            });
          }
        });
      });

      /*************
       * 
       * Handle typing indicators
       * 
       * ************* */
      socket.on('typing', (data: TypingData, callback) => {
        try {
          if (!data.conversationId || !Array.isArray(data.users)) {
            return callback?.({ success: false, message: 'Invalid typing data' });
          }

          const userName = userProfile?.name || user.name;
          const message = data.status ? `${userName} is typing...` : '';

          // Emit to other users in the chat
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
       * Handle user logout
       * 
       * ************* */

      socket.on('logout', () => {
        //handleUserDisconnection(userId, socket.id);
        handleUserDisconnection(userId, socket.id, onlineUsers, userSocketMap, socketUserMap, io);
      }); 

      /*************
       * 
       * Handle disconnection
       * 
       * ************* */

      socket.on('disconnect', (reason) => {
        console.log(`User ${user.name} disconnected: ${reason}`);
        // handleUserDisconnection(userId, socket.id);
        handleUserDisconnection(userId, socket.id, onlineUsers, userSocketMap, socketUserMap, io);
      });

    }catch(error){
      console.error('Socket connection setup error:', error);
      emitError(socket, 'Connection setup failed', true);
    }
  });

  // Error handling for the server
  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  return io;
};

export const socketHelper = { socketForChat };


/*****************
 * 
 * This is from Qwen Chat .. 
 * 
 * *************** */

const handleUserDisconnection = (
  userId: string,
  socketId: string,
  onlineUsers: Set<string>,
  userSocketMap: Map<string, string>,
  socketUserMap: Map<string, string>,
  io: Server
) => {
  logger.info(`User disconnected: ${userId}`);
  onlineUsers.delete(userId);
  userSocketMap.delete(userId);
  socketUserMap.delete(socketId);
  io.emit('online-users-updated', Array.from(onlineUsers));
};

/***********************

    Key Improvements Made:
    1. Authentication & Security

    Added Socket.IO middleware for authentication
    Better token validation
    Added CORS configuration from environment variables
    Added connection timeouts

    2. Error Handling

    Centralized error emission function
    Proper try-catch blocks everywhere
    Meaningful error messages with timestamps
    Graceful error responses

    3. Data Structures

    Used Set for online users (better performance)
    Added maps for socket-user relationships
    Better type definitions with interfaces

    4. Code Organization

    Extracted helper functions
    Reduced code duplication
    Better separation of concerns
    Cleaner event handlers

    5. Performance & Memory

    Better data structures
    Proper cleanup on disconnect
    Avoided memory leaks
    More efficient online user management

    6. Features & UX

    Added timestamps to messages
    Better typing indicators
    User join/leave notifications
    Read receipt improvements
    Personal user rooms for notifications

******************** */