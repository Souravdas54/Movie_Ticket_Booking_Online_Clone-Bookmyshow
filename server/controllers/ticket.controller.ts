// src/controllers/ticket.controller.ts
import { Request, Response } from "express";
import { ticketRepository } from "../repository/ticket.repo";
import { Types } from "mongoose";

export class TicketController {


    //  Get ticket details by booking ID

    async getTicketDetails(req: Request, res: Response) {
        try {
            const { bookingId } = req.params;
            const userId = req.user?.userId;

            if (!bookingId) {
                return res.status(400).json({
                    success: false,
                    message: "Booking bookingId is required"
                });
            }

            // ObjectId 
            if (!Types.ObjectId.isValid(bookingId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid ticket ID "
                });
            }

            const ticketDetails = await ticketRepository.getTicketDetails(bookingId, userId);

            if (!ticketDetails) {
                return res.status(404).json({
                    success: false,
                    message: "Ticket not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Ticket details retrieved successfully",
                data: ticketDetails
            });

        } catch (error: unknown) {
            console.error("Get ticket details error:", error);

            let statusCode = 500;
            let message = "Failed to get ticket details";

            // if (error.message.includes("Invalid booking ID")) {
            //     statusCode = 400;
            //     message = error.message;
            // } else if (error.message.includes("not found")) {
            //     statusCode = 404;
            //     message = error.message;
            // } else if (error.message.includes("Unauthorized")) {
            //     statusCode = 403;
            //     message = error.message;
            // }

            let errorMessage = "Something went wrong";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            return res.status(statusCode).json({
                success: false,
                message
            });
        }
    }

}


export const ticketController = new TicketController();