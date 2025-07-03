import { StatusCodes } from "http-status-codes";
import sendResponse from "../../../shared/sendResponse";
import { GenericController } from "../../__Generic/generic.controller";
import { IConversation } from "../conversation/conversation.interface";
import { ConversationParticipents } from "./conversationParticipents.model";

import {  ConversationParticipentsService } from "./conversationParticipents.service";
import pick from "../../../shared/pick";
import omit from "../../../shared/omit";
import catchAsync from "../../../shared/catchAsync";
import { Request, Response } from "express";
import { Conversation } from "../conversation/conversation.model";

export class ConversationParticipentsController extends GenericController<typeof ConversationParticipents, IConversation> {
  constructor(){
      super(new ConversationParticipentsService(), "Conversation Participents")
  }

  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'userId',
        select: 'name ' 
      },
      // 'personId'
      // {
      //   path: 'siteId',
      //   select: ''
      // }
    ];

    const select = '-__v -updatedAt -createdAt'; // -role

    const result = await this.service.getAllWithPagination(filters, options, populateOptions, select);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  // Check if logged-in user has a conversation with another user
  hasConversationWithUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const { otherUserId } = req.query; // userId,

    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'Both userId and otherUserId are required' });
    }

    
    // Find all conversations where the user is involved
    const userConversations = await ConversationParticipents.find({
      userId,
      isDeleted: false,
    }).select('conversationId');

    const conversationIds = userConversations.map((cp) => cp.conversationId);

    // Find a conversation among those where the otherUserId also participates
    const existingConversation = await ConversationParticipents.findOne({
      userId: otherUserId,
      conversationId: { $in: conversationIds },
      isDeleted: false,
    });

    if (existingConversation) {
      const fullConversation = await Conversation.findById(
        existingConversation.conversationId
      );
      // return res.json({
      //   exists: true,
      //   conversation: fullConversation,
      // });

      sendResponse(res, {
        code: StatusCodes.OK,
        data: fullConversation,
        message: `Conversation found`,
        success: true,
      });
    }

    sendResponse(res, {
        code: StatusCodes.NOT_FOUND,
        data: null,
        message: `Conversation not found`,
        success: true,
      });
  });

    // add more methods here if needed or override the existing ones
}