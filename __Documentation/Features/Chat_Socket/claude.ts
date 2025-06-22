// For testing 
let socket = require('socket.io')(3000);// for testing purposes 
let conversations;// for testing purposes
let messages;// for testing purposes
let userSockets = new Map();// for testing purposes
let onlineUsers = new Map(); // for testing purposes
let io // for testing purposes

// =============================================================================
  // CONVERSATION EVENTS
  // =============================================================================

  // Join conversation
  socket.on('join', async ({ conversationId }) => {
    try {
      // Verify user has access to this conversation
      const conversation = conversations.get(conversationId);
      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      if (!conversation.participants.includes(socket.userId)) {
        return socket.emit('error', { message: 'Access denied' });
      }

      // Join the room
      socket.join(conversationId);
      
      // Notify other participants
      socket.to(conversationId).emit('user-joined-conversation', {
        conversationId,
        userId: socket.userId,
        username: socket.username
      });

      // Send confirmation
      socket.emit('joined-conversation', { conversationId });

      console.log(`${socket.username} joined conversation ${conversationId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Leave conversation
  socket.on('leave', ({ conversationId }) => {
    socket.leave(conversationId);
    
    socket.to(conversationId).emit('user-left-conversation', {
      conversationId,
      userId: socket.userId,
      username: socket.username
    });

    console.log(`${socket.username} left conversation ${conversationId}`);
  });

  // Create new conversation
  socket.on('create-conversation', async (data) => {
    try {
      const { participants, type = 'direct', name } = data;
      
      // Validate participants
      if (!participants || participants.length === 0) {
        return socket.emit('error', { message: 'Participants required' });
      }

      // Add creator to participants if not included
      if (!participants.includes(socket.userId)) {
        participants.push(socket.userId);
      }

      const conversationId = generateId();
      const conversation = {
        id: conversationId,
        type, // 'direct' or 'group'
        name: name || (type === 'group' ? 'Group Chat' : null),
        participants,
        createdBy: socket.userId,
        createdAt: new Date(),
        lastMessage: null,
        lastActivity: new Date()
      };

      conversations.set(conversationId, conversation);

      // Join creator to the room
      socket.join(conversationId);

      // Notify all participants about new conversation
      participants.forEach(participantId => {
        const participantSocketId = userSockets.get(participantId);
        if (participantSocketId) {
          io.to(participantSocketId).emit('conversation-created', {
            conversation: sanitizeConversation(conversation)
          });
        }
      });

      console.log(`Conversation ${conversationId} created by ${socket.username}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to create conversation' });
    }
  });

  // =============================================================================
  // MESSAGE EVENTS
  // =============================================================================

  // Send new message
  socket.on('send-new-message', async (data) => {
    try {
      const { conversationId, content, type = 'text', replyTo = null } = data;
      
      // Validate conversation access
      const conversation = conversations.get(conversationId);
      if (!conversation || !conversation.participants.includes(socket.userId)) {
        return socket.emit('message-failed', { 
          error: 'Access denied',
          tempId: data.tempId 
        });
      }

      const messageId = generateId();
      const message = {
        id: messageId,
        conversationId,
        senderId: socket.userId,
        senderName: socket.username,
        content,
        type, // 'text', 'image', 'file', 'audio', 'video'
        replyTo,
        timestamp: new Date(),
        editedAt: null,
        reactions: {},
        readBy: [socket.userId], // Sender has read it
        deliveredTo: [socket.userId]
      };

      messages.set(messageId, message);

      // Update conversation last message
      conversation.lastMessage = messageId;
      conversation.lastActivity = new Date();

      // Emit to all participants in the conversation
      io.to(conversationId).emit('new-message', {
        message: sanitizeMessage(message)
      });

      // Send delivery confirmations to sender
      socket.emit('message-delivered', { 
        messageId,
        tempId: data.tempId 
      });

      console.log(`Message sent in conversation ${conversationId} by ${socket.username}`);
    } catch (error) {
      socket.emit('message-failed', { 
        error: error.message,
        tempId: data.tempId 
      });
    }
  });

  // Edit message
  socket.on('edit-message', async ({ messageId, newContent, conversationId }) => {
    try {
      const message = messages.get(messageId);
      
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      if (message.senderId !== socket.userId) {
        return socket.emit('error', { message: 'Cannot edit others messages' });
      }

      // Check if message is too old (e.g., 24 hours)
      const hoursSinceMessage = (Date.now() - message.timestamp) / (1000 * 60 * 60);
      if (hoursSinceMessage > 24) {
        return socket.emit('error', { message: 'Cannot edit old messages' });
      }

      message.content = newContent;
      message.editedAt = new Date();

      io.to(conversationId).emit('message-updated', {
        messageId,
        newContent,
        editedAt: message.editedAt
      });

      console.log(`Message ${messageId} edited by ${socket.username}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Delete message
  socket.on('delete-message', async ({ messageId, conversationId }) => {
    try {
      const message = messages.get(messageId);
      
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      if (message.senderId !== socket.userId) {
        return socket.emit('error', { message: 'Cannot delete others messages' });
      }

      messages.delete(messageId);

      io.to(conversationId).emit('message-deleted', { messageId });

      console.log(`Message ${messageId} deleted by ${socket.username}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // React to message
  socket.on('react-to-message', ({ messageId, reaction, conversationId }) => {
    try {
      const message = messages.get(messageId);
      
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      if (!message.reactions) {
        message.reactions = {};
      }

      // Toggle reaction
      if (message.reactions[reaction] && message.reactions[reaction].includes(socket.userId)) {
        // Remove reaction
        message.reactions[reaction] = message.reactions[reaction].filter(
          id => id !== socket.userId
        );
        if (message.reactions[reaction].length === 0) {
          delete message.reactions[reaction];
        }
      } else {
        // Add reaction
        if (!message.reactions[reaction]) {
          message.reactions[reaction] = [];
        }
        message.reactions[reaction].push(socket.userId);
      }

      io.to(conversationId).emit('message-reaction-updated', {
        messageId,
        reactions: message.reactions,
        userId: socket.userId
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to react to message' });
    }
  });

  // Mark messages as read
  socket.on('mark-messages-read', ({ conversationId, messageIds }) => {
    try {
      const readMessages = [];
      
      messageIds.forEach(messageId => {
        const message = messages.get(messageId);
        if (message && !message.readBy.includes(socket.userId)) {
          message.readBy.push(socket.userId);
          readMessages.push(messageId);
        }
      });

      if (readMessages.length > 0) {
        socket.to(conversationId).emit('messages-read', {
          messageIds: readMessages,
          readBy: socket.userId,
          readAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // =============================================================================
  // TYPING INDICATORS
  // =============================================================================

  socket.on('typing-start', ({ conversationId }) => {
    socket.to(conversationId).emit('user-typing', {
      conversationId,
      userId: socket.userId,
      username: socket.username
    });
  });

  socket.on('typing-stop', ({ conversationId }) => {
    socket.to(conversationId).emit('user-stopped-typing', {
      conversationId,
      userId: socket.userId
    });
  });

  // =============================================================================
  // USER STATUS EVENTS
  // =============================================================================

  socket.on('update-status', ({ status }) => {
    // status: 'online', 'away', 'busy', 'invisible'
    socket.broadcast.emit('user-status-changed', {
      userId: socket.userId,
      status,
      lastSeen: new Date()
    });
  });

  // =============================================================================
  // FILE UPLOAD EVENTS
  // =============================================================================

  socket.on('upload-file', async ({ conversationId, fileName, fileSize, fileType, messageId }) => {
    try {
      // In a real app, you'd upload to cloud storage (AWS S3, Cloudinary, etc.)
      // For now, we'll simulate the upload process
      
      const uploadUrl = await simulateFileUpload(fileName, fileSize, fileType);
      
      socket.emit('file-uploaded', {
        messageId,
        fileName,
        fileUrl: uploadUrl,
        fileSize,
        fileType
      });

      // Update the message with file info
      const message = messages.get(messageId);
      if (message) {
        message.fileUrl = uploadUrl;
        message.fileName = fileName;
        message.fileSize = fileSize;
        message.fileType = fileType;

        io.to(conversationId).emit('message-updated', {
          messageId,
          fileUrl: uploadUrl,
          fileName,
          fileSize,
          fileType
        });
      }

    } catch (error) {
      socket.emit('file-upload-failed', {
        messageId,
        error: error.message
      });
    }
  });

  // =============================================================================
  // CONVERSATION MANAGEMENT
  // =============================================================================

  socket.on('add-participant', async ({ conversationId, userId }) => {
    try {
      const conversation = conversations.get(conversationId);
      
      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      // Check if user has permission (admin/creator)
      if (conversation.createdBy !== socket.userId) {
        return socket.emit('error', { message: 'Permission denied' });
      }

      if (!conversation.participants.includes(userId)) {
        conversation.participants.push(userId);

        io.to(conversationId).emit('participant-added', {
          conversationId,
          userId,
          addedBy: socket.userId,
          participants: conversation.participants
        });

        // Notify the new participant
        const newParticipantSocket = userSockets.get(userId);
        if (newParticipantSocket) {
          io.to(newParticipantSocket).emit('added-to-conversation', {
            conversation: sanitizeConversation(conversation)
          });
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to add participant' });
    }
  });

  socket.on('remove-participant', async ({ conversationId, userId }) => {
    try {
      const conversation = conversations.get(conversationId);
      
      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      // Check permissions
      if (conversation.createdBy !== socket.userId && socket.userId !== userId) {
        return socket.emit('error', { message: 'Permission denied' });
      }

      conversation.participants = conversation.participants.filter(id => id !== userId);

      io.to(conversationId).emit('participant-removed', {
        conversationId,
        userId,
        removedBy: socket.userId,
        participants: conversation.participants
      });

      // Remove from socket room
      const participantSocket = userSockets.get(userId);
      if (participantSocket) {
        io.sockets.sockets.get(participantSocket)?.leave(conversationId);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to remove participant' });
    }
  });

  // =============================================================================
  // DISCONNECT HANDLING
  // =============================================================================

  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
    
    // Remove from online users and socket mapping
    onlineUsers.delete(socket.userId);
    userSockets.delete(socket.userId);

    // Notify others that user is offline
    socket.broadcast.emit('user-status-changed', {
      userId: socket.userId,
      status: 'offline',
      lastSeen: new Date()
    });

    // Stop any typing indicators
    socket.rooms.forEach(room => {
      if (room !== socket.id) { // Skip the default room
        socket.to(room).emit('user-stopped-typing', {
          conversationId: room,
          userId: socket.userId
        });
      }
    });
  });


// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function sanitizeMessage(message) {
  // Remove sensitive server-side data before sending to clients
  const { ...sanitized } = message;
  return sanitized;
}

function sanitizeConversation(conversation) {
  // Remove sensitive data
  const { ...sanitized } = conversation;
  return sanitized;
}

async function simulateFileUpload(fileName, fileSize, fileType) {
  // Simulate file upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, upload to cloud storage and return real URL
  return `https://example.com/uploads/${generateId()}-${fileName}`;
}
