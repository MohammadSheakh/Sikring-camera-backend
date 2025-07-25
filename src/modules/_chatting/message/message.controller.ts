import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { GenericController } from "../../__Generic/generic.controller";
import { Message } from "./message.model";
import {  MessagerService } from "./message.service";
import { Request, Response } from 'express';
import { AttachmentService } from "../../attachments/attachment.service";
import { AttachedToType } from "../../attachments/attachment.constant";
import { IMessage } from "./message.interface";
import { ConversationService } from "../conversation/conversation.service";
import omit from "../../../shared/omit";
import pick from "../../../shared/pick";

const attachmentService = new AttachmentService();
const conversationService = new ConversationService();

export class MessageController extends GenericController<typeof Message, IMessage> {
    messageService = new MessagerService();
    constructor(){
        super(new MessagerService(), "Message")
    }

    getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
        //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
        const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
        const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
        

         const populateOptions: (string | {path: string, select: string}[]) = [
            {
              path: 'senderId',
              select: 'name role profileImage' // name 
            },
            // 'personId'
            
            ];

        let select = ''; // Specify fields to exclude from the result
        // -createdAt
        const result = await this.service.getAllWithPagination(filters, options,populateOptions, select);

        sendResponse(res, {
        code: StatusCodes.OK,
        data: result,
        message: `All ${this.modelName} with pagination`,
        success: true,
        });
    });

    // 🟢 i think we dont need this .. because we need pagination in this case .. and pagination 
    // is already implemented ..  
    getAllMessageByConversationId = catchAsync(
        async (req: Request, res: Response) => {
            const { conversationId } = req.query;
            if (!conversationId) {
                return sendResponse(res, {
                    code: StatusCodes.BAD_REQUEST,
                    message: "Conversation ID is required",
                    success: false,
                });
            }

            const result = await this.messageService.getAllByConversationId(
                conversationId.toString()
            );

            sendResponse(res, {
                code: StatusCodes.OK,
                data: result,
                message: `${this.modelName} fetched successfully`,
                success: true,
            });
        }
    );

    


    // add more methods here if needed or override the existing ones    
}