import { Request, Response } from 'express';
import { bookingModel } from '../../models/booking.model';
import { movieModel } from '../../models/movie.model';
import { userModel } from '../../models/user.Model';
import { userRepositories } from '../../repository/user.repo';
import { TokenService } from '../../services/token.service';
import { roleModel } from '../../models/role.model';
import { UserValidation } from '../../validation/user.validation';
import bcrypt from 'bcryptjs';

class AdminController {

    async admin_login(req: Request, res: Response): Promise<any> {
        try {
            const data = {
                email: req.body.email,
                password: req.body.password,
            };

            const { error, value } = UserValidation.login.validate(data);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            const userData = await userRepositories.findByEmail(value.email);
            if (!userData) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const isPasswordMatch = await bcrypt.compare(value.password, userData.password);
            if (!isPasswordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid password"
                });
            }

            // Get role name
            let roleName: string;
            if (typeof userData.role === 'string') {
                roleName = userData.role;
            } else {
                const roleDoc = await roleModel.findById(userData.role);
                if (!roleDoc) {
                    return res.status(500).json({
                        success: false,
                        message: "Role not found"
                    });
                }
                roleName = roleDoc.name;
            }


            // Generate tokens
            const accessToken = TokenService.generateAccessToken(userData, roleName);
            const refreshToken = TokenService.generateRefreshToken(userData, roleName);

            await userRepositories.updateRefreshToken(userData._id.toString(), refreshToken);

            // Prepare user response without password
            const userResponse = {
                _id: userData._id,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                profilePicture: userData.profilePicture,
                isVerified: userData.isVerified,
                role: roleName,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt
            };

            const isAdmin = roleName.toLowerCase() === 'admin';

            const prefix = isAdmin ? 'admin' : 'user';

            res.cookie(`${prefix}AccessToken`, accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                // maxAge: 15 * 60 * 1000
            });

            res.cookie(`${prefix}RefreshToken`, refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000
            });

            res.cookie(`${prefix}AccessTokenExpires`, process.env.JWT_ACCESS_EXPIRES_IN || '1h', {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000
            });

            res.cookie(`${prefix}RefreshTokenExpires`, process.env.JWT_REFRESH_EXPIRES_IN || '1d', {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.redirect('/admin/dashboard')

        } catch (error: any) {
            console.log("Login error:", error.message);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    async admin_refreshToken(req: Request, res: Response): Promise<any> {
        try {
            // const { refreshToken } = req.body;
            const refreshToken = req.cookies.adminRefreshToken || req.body.adminRefreshToken;;

            if (!refreshToken) {
                return res.redirect('/admin/login');
            }


            const user = await userRepositories.findByRefreshToken(refreshToken);
            if (!user) {
                return res.redirect('/admin/login');
            }

            const decoded = TokenService.verifyRefreshToken(refreshToken) as any;

            let roleName: string;
            if (typeof user.role === 'string') {
                roleName = user.role;
            } else {
                const roleDoc = await roleModel.findById(user.role);
                roleName = roleDoc?.name || 'user';
            }

            const newAccessToken = TokenService.generateAccessToken(user, roleName);

            const newRefreshToken = refreshToken

            await userRepositories.updateRefreshToken(user._id.toString(), newRefreshToken);

            // SET COOKIES
            res.cookie('adminAccessToken', newAccessToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
            });

            res.cookie('adminRefreshToken', newRefreshToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
            });

            return res.redirect('/admin/dashboard');

        } catch (error: any) {
            console.log("Refresh Token Error:", error.message);
            return res.redirect('/admin/login');
        }
    }

    // async admin_dashboard(req: Request, res: Response): Promise<void> {
    //     try {
    //         // Get total movies count using aggregation
    //         const moviesCount = await movieModel.aggregate([
    //             {
    //                 $count: "totalMovies"
    //             }
    //         ]);

    //         // Get total bookings count using aggregation
    //         const bookingsCount = await bookingModel.aggregate([
    //             {
    //                 $count: "totalBookings"
    //             }
    //         ]);

    //         // Calculate total revenue using aggregation pipeline
    //         const revenueData = await bookingModel.aggregate([
    //             {
    //                 $match: {
    //                     status: "Confirmed",
    //                     paymentStatus: "Paid"
    //                 }
    //             },
    //             {
    //                 $group: {
    //                     _id: null,
    //                     totalRevenue: { $sum: "$totalAmount" },
    //                     totalBookings: { $sum: 1 }
    //                 }
    //             }
    //         ]);

    //         // Get recent bookings with aggregation (without populate)
    //         const recentBookings = await bookingModel.aggregate([
    //             {
    //                 $sort: { createdAt: -1 }
    //             },
    //             {
    //                 $limit: 5
    //             },
    //             {
    //                 $lookup: {
    //                     from: "movies",
    //                     localField: "movieId",
    //                     foreignField: "_id",
    //                     as: "movieData"
    //                 }
    //             },
    //             {
    //                 $lookup: {
    //                     from: "users",
    //                     localField: "userId",
    //                     foreignField: "_id",
    //                     as: "userData"
    //                 }
    //             },
    //             {
    //                 $lookup: {
    //                     from: "theaters",
    //                     localField: "theaterId",
    //                     foreignField: "_id",
    //                     as: "theaterData"
    //                 }
    //             },
    //             {
    //                 $lookup: {
    //                     from: "shows",
    //                     localField: "showId",
    //                     foreignField: "_id",
    //                     as: "showData"
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     _id: 1,
    //                     bookingId: { $toString: "$_id" },
    //                     movieName: {
    //                         $arrayElemAt: ["$movieData.moviename", 0]
    //                     },
    //                     userEmail: {
    //                         $arrayElemAt: ["$userData.email", 0]
    //                     },
    //                     userName: {
    //                         $arrayElemAt: ["$userData.name", 0]
    //                     },
    //                     theaterName: {
    //                         $arrayElemAt: ["$theaterData.theatername", 0]
    //                     },
    //                     showTime: {
    //                         $arrayElemAt: ["$showData.showTime", 0]
    //                     },
    //                     showDate: {
    //                         $arrayElemAt: ["$showData.date", 0]
    //                     },
    //                     seats: 1,
    //                     totalAmount: 1,
    //                     status: 1,
    //                     paymentStatus: 1,
    //                     bookedAt: 1,
    //                     createdAt: 1
    //                 }
    //             }
    //         ]);

    //         // ✅ Get today's bookings count
    //         const today = new Date();
    //         today.setHours(0, 0, 0, 0);

    //         const todayBookings = await bookingModel.aggregate([
    //             {
    //                 $match: {
    //                     createdAt: { $gte: today }
    //                 }
    //             },
    //             {
    //                 $count: "count"
    //             }
    //         ]);

    //         // ✅ Get popular movies (most booked)
    //         const popularMovies = await bookingModel.aggregate([
    //             {
    //                 $group: {
    //                     _id: "$movieId",
    //                     bookingCount: { $sum: 1 },
    //                     totalRevenue: { $sum: "$totalAmount" }
    //                 }
    //             },
    //             {
    //                 $sort: { bookingCount: -1 }
    //             },
    //             {
    //                 $limit: 5
    //             },
    //             {
    //                 $lookup: {
    //                     from: "movies",
    //                     localField: "_id",
    //                     foreignField: "_id",
    //                     as: "movieInfo"
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     movieName: { $arrayElemAt: ["$movieInfo.moviename", 0] },
    //                     bookingCount: 1,
    //                     totalRevenue: 1
    //                 }
    //             }
    //         ]);

    //         // ✅ Use actual user data from request
    //         const user = await userModel.findById(req.user?.userId).select('name email');

    //         const dashboardData = {
    //             title: 'Admin Dashboard - BookMyCinema',
    //             user: {
    //                 name: user?.name,
    //                 email: user?.email,
    //                 avatar: user?.name.charAt(0).toUpperCase(),
    //                 profilePicture: user?.profilePicture || null,
    //                 role: req.user?.role || 'N/A'
    //             },
    //             stats: {
    //                 totalMovies: moviesCount[0]?.totalMovies || 0,
    //                 totalBookings: bookingsCount[0]?.totalBookings || 0,
    //                 totalRevenue: `₹${(revenueData[0]?.totalRevenue || 0).toLocaleString()}`,
    //                 todayBookings: todayBookings[0]?.count || 0,
    //                 pendingReviews: 12 // আপনি এটি পরে implement করতে পারেন
    //             },
    //             recentBookings: recentBookings.map(booking => ({
    //                 id: `#BKM${booking.bookingId.slice(-4).toUpperCase()}`,
    //                 movie: booking.movieName || 'N/A',
    //                 user: booking.userEmail || 'N/A',
    //                 userName: booking.userName || 'N/A',
    //                 theater: booking.theaterName || 'N/A',
    //                 showTime: booking.showTime || 'N/A',
    //                 showDate: booking.showDate ? new Date(booking.showDate).toLocaleDateString() : 'N/A',
    //                 bookedAt: booking.bookedAt ? new Date(booking.bookedAt).toLocaleString() : 'N/A',
    //                 seats: Array.isArray(booking.seats) ? booking.seats.join(', ') : 'N/A',
    //                 amount: `₹${booking.totalAmount}`,
    //                 status: booking.status,
    //                 paymentStatus: booking.paymentStatus
    //             })),
    //             popularMovies: popularMovies.map(movie => ({
    //                 name: movie.movieName || 'N/A',
    //                 bookings: movie.bookingCount,
    //                 revenue: `₹${movie.totalRevenue}`
    //             }))
    //         };

    //         res.render('', dashboardData
    //             //  {
    //             //     title: 'Admin Dashboard',
    //             //     // user: req.user // যদি authentication থাকে
    //             // }
    //         );
    //     } catch (error) {
    //         console.error('Dashboard render error:', error);
    //         res.status(500).render('error', {
    //             message: 'Dashboard load করতে সমস্যা হয়েছে'
    //         });
    //     }
    // }

    // async admin_chat(req: Request, res: Response): Promise<void> {
    //     try {

    //         // const adminUser = await userModel.findById(req.user?.userId);
    //         if (!req.user) {
    //             return res.redirect('/admin/login');
    //         }
    //         res.render('chat', {
    //             title: "Chat",
    //             admin: {
    //                 _id: req.body._id,
    //                 name: req.body.name,
    //                 email: req.body.email,
    //                 profilePicture: req.body.profilePicture
    //             }

    //         })
    //     } catch (error) {
    //         res.status(500).send("Something went wrong");
    //     }
    // }

}

export const adminController = new AdminController()
