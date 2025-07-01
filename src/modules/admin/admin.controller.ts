import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { adminService } from "./admin.service";
import { Request, Response } from "express";

export class AdminController {
  adminService = new adminService();

  getAllKeyMetricsWithReportCountByMonths = catchAsync(
    async(req: Request, res: Response) => {
      // console.log("hit ⚡", req.user.userId);
      
      const keyMetrics = await this.adminService.getAllKeyMetricsWithReportCountByMonths();
      // res.status(200).json({
      //   success: true,
      //   message: "Key metrics fetched successfully",
      //   data: keyMetrics,
      // });

      sendResponse(res, {
            code: StatusCodes.OK,
            data: keyMetrics,
            message: `key metrics fetched successfully`,
            success: true,
      });
    }
  ) 
}