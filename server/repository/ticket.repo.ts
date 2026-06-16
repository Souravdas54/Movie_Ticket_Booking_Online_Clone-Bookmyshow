// src/repositories/ticket.repository.ts
import { Types } from "mongoose";
import { bookingModel } from "../models/booking.model";
import { paymentModel } from "../models/payment.model";
import { movieModel } from "../models/movie.model";
import { theaterModel } from "../models/theaters.model";
import { showModel } from "../models/show.model";
import { userModel } from "../models/user.Model";

class TicketRepository {

    async getTicketDetails(bookingId: string, userId?: string) {
        try {
            // Validate booking ID
            if (!Types.ObjectId.isValid(bookingId)) {
                throw new Error("Invalid booking ID format");
            }

            const objectId = new Types.ObjectId(bookingId);

            // Get booking details
            const booking = await bookingModel.findById(objectId).lean();
            if (!booking) {
                throw new Error("Booking not found");
            }

            // Check authorization - only booking owner or admin can view
            if (userId && booking.userId.toString() !== userId.toString()) {

                throw new Error("Unauthorized to view this ticket");
            }

            // Fetch all related data in parallel for better performance
            const [
                movie,
                theater,
                show,
                user,
                payment
            ] = await Promise.all([
                // Get movie details
                movieModel.findById(booking.movieId).select('moviename genre duration language rating ').lean(),

                // Get theater details
                theaterModel.findById(booking.theaterId).select('theatername district').lean(),

                // Get show details
                showModel.findById(booking.showId).select('date timeSlots room screen').lean(),

                // Get user details
                userModel.findById(booking.userId).select('name email phone').lean(),

                // Get payment details
                paymentModel.findOne({
                    bookingId: objectId,
                    status: 'succeeded'
                }).select('amount currency paymentMethod paymentDate').sort({ createdAt: -1 }).lean()
            ]);

            // Construct ticket object
            const ticketDetails = {
                booking: {
                    _id: booking._id.toString(),
                    seats: booking.seats,
                    baseAmount: booking.baseAmount,
                    serviceCharge: booking.serviceCharge,
                    totalAmount: booking.totalAmount,
                    status: booking.status,
                    paymentStatus: booking.paymentStatus,
                    bookedAt: booking.bookedAt,
                    qrCodeData: booking.qrCodeData,
                    createdAt: booking.createdAt,
                    updatedAt: booking.updatedAt
                },
                movie: movie ? {
                    moviename: movie.moviename,
                    genre: movie.genre || [],
                    duration: movie.duration || 0,
                    language: movie.language || 'English',
                    rating: movie.rating || 'U/A',

                } : null,
                theater: theater ? {
                    theatername: theater.theatername,
                    district: theater.district || '',

                } : null,
                show: show ? {
                    date: show.date,
                    timeSlots: show.timeSlots || [],
                    room: show.room || 'Standard',
                    screen: show.screenNumber || '1',

                } : null,
                user: user ? {
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                } : null,
                payment: payment ? {
                    amount: payment.amount,
                    currency: payment.currency || 'inr',
                    paymentMethod: payment.paymentMethod || 'card',
                    paymentDate: payment.paymentDate || payment.createdAt
                } : null,
                additionalInfo: {
                    bookingReference: `BK-${booking._id.toString().slice(-8).toUpperCase()}`,
                    ticketCount: booking.seats.length,

                }
            };

            return ticketDetails;

        } catch (error) {
            throw error;

        }
    }

}

const ticketRepository = new TicketRepository();
export { ticketRepository }