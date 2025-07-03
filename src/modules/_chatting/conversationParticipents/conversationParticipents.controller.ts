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

export class ConversationParticipentsController extends GenericController<typeof ConversationParticipents, IConversation> {
    constructor(){
        super(new ConversationParticipentsService(), "Conversation Participents")
    }

    getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      // {
      //   path: 'personId',
      //   select: 'name ' 
      // },
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


    // add more methods here if needed or override the existing ones
}