// socketServer.ts
import { Server } from "socket.io";
import mongoose from "mongoose";
import { chatModel } from "./models/chat.model";

export const socketHandler = (io: Server) => {
    // Store online users
    const onlineUsers = new Map(); // userId -> socketId
    
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Register user when they connect
        socket.on("register", (userId: string) => {
            // Validate userId format
            if (mongoose.Types.ObjectId.isValid(userId)) {
                onlineUsers.set(userId, socket.id);
                console.log(`User ${userId} connected`);
                
                // Broadcast online users update
                io.emit('onlineUsers', Array.from(onlineUsers.keys()));
            } else {
                console.error(`Invalid user ID format: ${userId}`);
            }
        });

        // Join Chat Room
        socket.on("join", ({ chatId, userId }) => {
            socket.join(chatId);
            socket.data.userId = userId;
            console.log(`User ${userId} joined chat ${chatId}`);
        });

        // Send Message
        socket.on("sendMessage", async (msg: {
            chatId: string;
            senderId: string;
            receiverId: string;
            message: string;
        }) => {
            try {
                console.log("Received message:", msg);
                
                // Validate ObjectIds
                if (!mongoose.Types.ObjectId.isValid(msg.senderId) || 
                    !mongoose.Types.ObjectId.isValid(msg.receiverId) ||
                    !mongoose.Types.ObjectId.isValid(msg.chatId)) {
                    console.error("Invalid ObjectId format in message:", msg);
                    return;
                }

                const chat = await chatModel.findById(msg.chatId);
                if (!chat) {
                    console.error("Chat not found:", msg.chatId);
                    return;
                }

                // Validate participants
                const isValidParticipant = chat.participants.some(
                    (participant: any) => participant.toString() === msg.senderId
                );

                if (!isValidParticipant) {
                    console.error("Sender not in chat participants");
                    return;
                }
                
                // Create message object with proper ObjectIds
                const messageObj = {
                    _id: new mongoose.Types.ObjectId(),
                    senderId: new mongoose.Types.ObjectId(msg.senderId),
                    receiverId: new mongoose.Types.ObjectId(msg.receiverId),
                    message: msg.message,
                    type: "text",
                    read: false,
                    createdAt: new Date(),
                };

                // Add to chat messages
                chat.messages.push(messageObj);
                // Update lastMessage
                chat.lastMessage = messageObj;
                chat.updatedAt = new Date();

                await chat.save();

                // Emit to chat room
                io.to(msg.chatId).emit("message", {
                    ...messageObj,
                    chatId: msg.chatId,
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    _id: messageObj._id.toString(),
                    createdAt: messageObj.createdAt.toISOString()
                });
                
                console.log("Message saved and broadcasted successfully");
            } catch (error) {
                console.error("Message error:", error);
            }
        });

        // Typing indicator
        socket.on("typing", ({ chatId, userId, isTyping }) => {
            socket.to(chatId).emit("typing", {
                userId,
                isTyping,
                chatId,
            });
        });

        // Mark messages as read
        socket.on("markAsRead", async ({ chatId, userId }) => {
            try {
                // Validate ObjectIds
                if (!mongoose.Types.ObjectId.isValid(chatId) || 
                    !mongoose.Types.ObjectId.isValid(userId)) {
                    console.error("Invalid ObjectId format in markAsRead");
                    return;
                }

                const chat = await chatModel.findById(chatId);
                if (chat) {
                    let hasUpdates = false;

                    chat.messages.forEach((msg: any) => {
                        if (msg.receiverId.toString() === userId && !msg.read) {
                            msg.read = true;
                            msg.readAt = new Date();
                            hasUpdates = true;
                        }
                    });
                    
                    if (hasUpdates) {
                        await chat.save();
                        io.to(chatId).emit("messagesRead", { chatId, userId });
                    }
                }
            } catch (error) {
                console.error("Error marking messages as read:", error);
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
            
            // Remove user from online users
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
                    break;
                }
            }
        });
    });
};

// import { Server } from "socket.io";
// import mongoose from "mongoose";
// import { chatModel } from "./models/chat.model";


// export const socketHandler = (io: Server) => {

//       // Store online users
//   const onlineUsers = new Map(); // userId -> socketId
  
//   io.on("connection", (socket) => {
//     console.log("Socket connected:", socket.id);

//      // Register user when they connect
//     socket.on("register", (userId: string) => {
//       onlineUsers.set(userId, socket.id);
//       console.log(`User ${userId} connected`);
//     });

//     // Join Chat Room
//     socket.on("join", ({ chatId, userId }) => {
//       socket.join(chatId);
//       socket.data.userId = userId;
//     });

//     // Send Message
//     socket.on(
//       "sendMessage",
//       async (msg: {
//         chatId: string;
//         senderId: string;
//         receiverId: string;
//         message: string;
//       }) => {
//         try {
//           const chat = await chatModel.findById(msg.chatId);
//           if (!chat) return;

//             // Validate participants
//           const isValidParticipant = chat.participants.some(
//             participant => participant.toString() === msg.senderId
//           );

//           if (!isValidParticipant) {
//             console.error("Sender not in chat participants");
//             return;
//           }
          
//           const messageObj = {
//              _id: new mongoose.Types.ObjectId(),
//             senderId: new mongoose.Types.ObjectId(msg.senderId),
//             receiverId: new mongoose.Types.ObjectId(msg.receiverId),
//             message: msg.message,
//             type: "text",
//             read: false,
//             createdAt: new Date(),
//           };

//             // Add to chat messages
//           chat.messages.push(messageObj);
//           // Update lastMessage
//           chat.lastMessage = messageObj;
//           chat.updatedAt = new Date();

//           await chat.save();

//           // Emit to chat room
//           io.to(msg.chatId).emit("message", {
//             ...messageObj,
//             chatId: msg.chatId,
//              senderId: msg.senderId,
//             receiverId: msg.receiverId,
//             _id: messageObj._id.toString(),
//             createdAt: messageObj.createdAt.toISOString()
//           });

//           // Also notify the receiver if they're online
//           const receiverSocketId = onlineUsers.get(msg.receiverId);
//           if (receiverSocketId) {
//             io.to(receiverSocketId).emit("newMessage", {
//               ...messageObj,
//               chatId: msg.chatId,
//               message: msg.message,
//               senderId: msg.senderId,
//               createdAt: new Date().toISOString()
//             });
//           }
//         } catch (error) {
//           console.log("Message error:", error);
//         }
//       }
//     );

//     // Typing indicator
//     socket.on("typing", ({ chatId, userId, isTyping }) => {
//       socket.to(chatId).emit("typing", {
//         userId,
//         isTyping,
//         chatId,
//       });
//     });

//       // Mark messages as read
//     socket.on("markAsRead", async ({ chatId, userId }) => {
//       try {
//         const chat = await chatModel.findById(chatId);
//         if (chat) {
//              let hasUpdates = false;

//           chat.messages.forEach(msg => {
//             if (msg.receiverId.toString() === userId && !msg.read) {
//               msg.read = true;
//               msg.readAt = new Date();
//               hasUpdates = true;
//             }
//           });
          
//           if (hasUpdates) {
//             await chat.save();
//             io.to(chatId).emit("messagesRead", { chatId, userId });
//           }

//         //   await chat.save();
//         //   io.to(chatId).emit("messagesRead", { chatId, userId });
//         }
//       } catch (error) {
//         console.error("Error marking messages as read:", error);
//       }
//     });


//     socket.on("disconnect", () => {
//       console.log("Socket disconnected:", socket.id);
//     });
//   });
// };


// import { Server } from 'socket.io';
// import { createServer } from 'http';
// import mongoose from 'mongoose';
// import { chatModel } from './models/chat.model';
// import { userModel } from './models/user.Model';

// export const setupSocketServer = (app: any) => {
//   const httpServer = createServer(app);
  
//   const io = new Server(httpServer, {
//     cors: {
//       origin: process.env.FRONTEND_URL || "http://localhost:3000",
//       credentials: true,
//       methods: ['GET', 'POST'],
//     },
//     transports: ['websocket', 'polling'],
//   });

//   // Store online users
//   const onlineUsers = new Map(); // userId -> socketId
//   const userSockets = new Map(); // socketId -> userId

//   io.on('connection', (socket) => {
//     console.log('🔌 Socket connected:', socket.id);

//     // User joins with their userId
//     socket.on('register', (userId: string) => {
//       onlineUsers.set(userId, socket.id);
//       userSockets.set(socket.id, userId);
//       console.log(`👤 User ${userId} connected`);
      
//       // Join user's personal room
//       socket.join(`user_${userId}`);
//     });

//     // Join a specific chat room
//     socket.on('joinChat', (chatId: string) => {
//       socket.join(`chat_${chatId}`);
//       console.log(`💬 Socket ${socket.id} joined chat: ${chatId}`);
//     });

//     // Send a message
//     socket.on('sendMessage', async (data: {
//       chatId: string;
//       senderId: string;
//       receiverId: string;
//       message: string;
//     }) => {
//       try {
//         console.log('📩 New message:', data);

//         const chat = await chatModel.findById(data.chatId);
//         if (!chat) {
//           console.log('❌ Chat not found');
//           return;
//         }

//         // Create message object
//         const messageObj = {
//           senderId: new mongoose.Types.ObjectId(data.senderId),
//           receiverId: new mongoose.Types.ObjectId(data.receiverId),
//           message: data.message,
//           type: 'text',
//           createdAt: new Date(),
//           read: false,
//         };

//         // Add to chat
//         chat.messages.push(messageObj);
//         chat.updatedAt = new Date();
//         await chat.save();

//         // Prepare response
//         const response = {
//           _id: messageObj._id || new mongoose.Types.ObjectId(),
//           ...messageObj,
//           chatId: data.chatId,
//         };

//         // Emit to chat room
//         io.to(`chat_${data.chatId}`).emit('newMessage', response);
        
//         // Also emit to receiver's personal room
//         const receiverSocketId = onlineUsers.get(data.receiverId);
//         if (receiverSocketId) {
//           io.to(receiverSocketId).emit('messageNotification', {
//             chatId: data.chatId,
//             message: data.message,
//             senderId: data.senderId,
//           });
//         }

//         console.log('✅ Message sent successfully');
//       } catch (error) {
//         console.error('❌ Error sending message:', error);
//         socket.emit('messageError', { error: 'Failed to send message' });
//       }
//     });

//     // Mark messages as read
//     socket.on('markAsRead', async (data: { chatId: string, userId: string }) => {
//       try {
//         const chat = await chatModel.findById(data.chatId);
//         if (chat) {
//           chat.messages.forEach(msg => {
//             if (msg.receiverId.toString() === data.userId && !msg.read) {
//               msg.read = true;
//               msg.readAt = new Date();
//             }
//           });
//           await chat.save();
//           io.to(`chat_${data.chatId}`).emit('messagesRead', { chatId: data.chatId, userId: data.userId });
//         }
//       } catch (error) {
//         console.error('Error marking messages as read:', error);
//       }
//     });

//     // Typing indicator
//     socket.on('typing', (data: { chatId: string, userId: string, isTyping: boolean }) => {
//       socket.to(`chat_${data.chatId}`).emit('typing', {
//         userId: data.userId,
//         isTyping: data.isTyping,
//         chatId: data.chatId,
//       });
//     });

//     // Disconnect
//     socket.on('disconnect', () => {
//       const userId = userSockets.get(socket.id);
//       if (userId) {
//         onlineUsers.delete(userId);
//         userSockets.delete(socket.id);
//         console.log(`👋 User ${userId} disconnected`);
//       }
//     });
//   });

//   return { httpServer, io };
// };