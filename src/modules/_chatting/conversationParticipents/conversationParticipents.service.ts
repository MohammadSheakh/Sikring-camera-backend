import { GenericService } from '../../__Generic/generic.services';
import { IConversationParticipents } from './conversationParticipents.interface';
import { ConversationParticipents } from './conversationParticipents.model';

export class ConversationParticipentsService extends GenericService<
  typeof ConversationParticipents, IConversationParticipents
> {
  constructor() {
    super(ConversationParticipents);
  }

  async getByUserIdAndConversationId(userId: string, conversationId: string) {
    const object = await this.model.find({ userId , conversationId});
    
    if (!object) {
      // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
      return null;
    }
    return object;
  }

  async getByConversationId(conversationId: any) {
    const object = await this.model.find({ conversationId });
    if (!object) {
      // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
      return null;
    }
    return object;
  }

  /*************
   * 
   * ( Dashboard ) | Admin :: getAllConversationAndItsParticipantsBySiteId
   * 
   * *********** */
  async getByConversationIdForAdminDashboard(conversationId: any) {
    const object = await this.model.find({ conversationId }).select('-joinedAt -createdAt -updatedAt -__v')
    .populate({
      path: 'userId',
      select:'name role'
    });
    if (!object) {
      // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
      return null;
    }
    return object;
  }

  /**********
   * 
   * Socket Helper Function
   * 
   * we need logged in users conversationsParticipents where we want to show only another person not logged in user  
   * For App ... 
   * 
   * ********** */
  async getAllConversationByUserId(userId: any) {
    let loggedInUserId = userId;
    // Step 1: Find all conversations the logged-in user participates in
    const userConversations = await ConversationParticipents.find({
      userId: loggedInUserId,
      isDeleted: false
    }).select('conversationId');

    const conversationIds = userConversations.map(conv => conv.conversationId);

    // Step 2: Find all participants in those conversations (excluding the logged-in user)
    const relatedParticipants = await ConversationParticipents.find({
      conversationId: { $in: conversationIds },
      userId: { $ne: loggedInUserId },
      isDeleted: false
    })
    .populate({
      path: 'userId',
      select: 'name profileImage role'
    })
    .populate({
      path: 'conversationId',
      select: 'lastMessage updatedAt'
    });

    // Step 3: Remove duplicates and format data
    const uniqueUsers = {};
    
    relatedParticipants.forEach(participant => {
      const userId = participant.userId._id.toString();
      
      if (!uniqueUsers[userId]) {
        uniqueUsers[userId] = {
          userId: {
            _userId: participant.userId._id,
            name: participant.userId.name,
            profileImage: participant.userId.profileImage,
            role: participant.userId.role
          },
          conversations: [],
          isOnline: global.socketUtils.isUserOnline(userId),
          // participantInfo: {
          //   joinedAt: participant.joinedAt,
          //   isDeleted: participant.isDeleted,
          //   _conversationParticipentsId: participant._id
          // }
        };
      }
      
      // Add conversation if not already added
      const conversationExists = uniqueUsers[userId].conversations.some(
        conv => conv._conversationId.toString() === participant.conversationId._id.toString()
      );
      
      if (!conversationExists) {
        uniqueUsers[userId].conversations.push({
          _conversationId: participant.conversationId._id,
          lastMessage: participant.conversationId.lastMessage,
          updatedAt: participant.conversationId.updatedAt
        });
      }
    });

    return Object.values(uniqueUsers);
  }

  // async getByUserId(userId: any) {
  //   const object = await this.model.find({ userId });
  //   if (!object) {
  //     // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
  //     return null;
  //   }
  //   return object;
  // }
}
