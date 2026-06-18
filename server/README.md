{
  "name": "server",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "nodemon dist/server.js",
    "dev": "nodemon server.ts",
    "build": "tsc --project tsconfig.json"
  },
  "keywords": [],
  "author": "sourav",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@types/connect-flash": "^0.0.40",
    "@types/cookie-parser": "^1.4.10",
    "@types/ejs": "^3.1.5",
    "@types/express-session": "^1.18.2",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/lodash": "^4.17.20",
    "@types/multer": "^2.0.0",
    "@types/nodemailer": "^7.0.3",
    "@types/socket.io": "^3.0.1",
    "bcryptjs": "^3.0.3",
    "body-parser": "^2.2.0",
    "cloudinary": "^1.41.3",
    "connect-flash": "^0.1.1",
    "connect-mongo": "^6.0.0",
    "connect-redis": "^9.0.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "ejs": "^3.1.10",
    "express": "^5.1.0",
    "express-session": "^1.18.2",
    "express-validator": "^7.3.0",
    "geoip-lite": "^1.4.10",
    "joi": "^18.0.1",
    "jsonwebtoken": "^9.0.2",
    "lodash": "^4.17.21",
    "mongodb": "^7.0.0",
    "mongoose": "^8.19.3",
    "multer": "^2.0.2",
    "multer-storage-cloudinary": "^4.0.0",
    "nodemailer": "^7.0.10",
    "qrcode": "^1.5.4",
    "redis": "^5.9.0",
    "socket.io": "^4.8.1",
    "stripe": "^22.2.1",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1",
    "yamljs": "^0.3.0"
  },
  "devDependencies": {
    "@types/body-parser": "^1.19.6",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.5",
    "@types/node": "^24.10.0",
    "@types/qrcode": "^1.5.6",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.8",
    "@types/yamljs": "^0.2.34",
    "nodemon": "^3.1.10",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  }
}


+++++++++++++++++++++++++++++++++++++++++++
chatController.ts
import { Request, Response } from "express";
import { chatModel } from "../models/chat.model";
import { userModel } from "../models/user.Model";
import mongoose from "mongoose";
class ChatController {
    async startChat(req: Request, res: Response) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ 
                    success: false,
                    message: "User ID is required" 
                });
            }

            // Validate if user exists
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    message: "User not found" 
                });
            }

            // Find support admin - check for isSupportAdmin first
            let admin = await userModel.findOne({
                isSupportAdmin: true
            });

            // If no support admin found, find any admin and make them support admin
            if (!admin) {
                admin = await userModel.findOne({ 
                    role: "admin" 
                });
                
                if (!admin) {
                    return res.status(500).json({ 
                        success: false,
                        message: "No admin available for support" 
                    });
                }
                
                // Mark this admin as support admin
                admin.isSupportAdmin = true;
                await admin.save();
            }

            // Check for existing chat with this admin
            let chat = await chatModel.findOne({
                participants: { 
                    $all: [
                        new mongoose.Types.ObjectId(userId),
                        admin._id
                    ] 
                },
                isSupportChat: true,
            }).populate('participants', 'name email profilePicture');

            if (chat) {
                return res.json({
                    success: true,
                    message: "Chat retrieved successfully",
                    chat
                });
            }

            // Create welcome message
            const welcomeMessage = {
                _id: new mongoose.Types.ObjectId(),
                senderId: admin._id,
                receiverId: new mongoose.Types.ObjectId(userId),
                message: "Hello! I'm your support assistant. How can I help you today?",
                type: "text",
                read: false,
                createdAt: new Date()
            };

            // Create new chat
            chat = await chatModel.create({
                participants: [
                    new mongoose.Types.ObjectId(userId),
                    admin._id,
                ],
                isSupportChat: true,
                messages: [welcomeMessage],
                lastMessage: welcomeMessage,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            // Populate after creation
            chat = await chatModel.findById(chat._id)
                .populate('participants', 'name email profilePicture');

            res.status(201).json({
                success: true,
                message: "Chat started successfully",
                chat
            });
        } catch (err: any) {
            console.error("Error starting chat:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error", 
                error: err.message 
            });
        }
    }
    async listAdminChats(req: Request, res: Response) {
        try {
            const { adminId } = req.query;

            if (!adminId) {
                return res.status(400).json({ 
                    success: false,
                    message: "Admin ID is required" 
                });
            }

            // Find admin to verify
            const admin = await userModel.findOne({ 
                _id: adminId,
                $or: [
                    { isSupportAdmin: true },
                    { role: "admin" }
                ]
            });

            if (!admin) {
                return res.status(403).json({ 
                    success: false,
                    message: "Unauthorized: Not an admin" 
                });
            }
            const chats = await chatModel.find({ 
                participants: new mongoose.Types.ObjectId(adminId as string),
                isSupportChat: true 
            })
            .populate({
                path: 'participants',
                select: 'name email profilePicture',
                match: { _id: { $ne: new mongoose.Types.ObjectId(adminId as string) } }
            })
            .populate('messages.senderId', 'name profilePicture')
            .sort({
                updatedAt: -1,
            });
            // Filter out chats where participants array might be empty after filtering
            const filteredChats = chats.filter(chat => 
                chat.participants && chat.participants.length > 0
            );
            res.json({
                success: true,
                count: filteredChats.length,
                chats: filteredChats
            });
        } catch (err: any) {
            console.error("Error listing admin chats:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error",
                error: err.message 
            });
        }
    }
    async fetchMessages(req: Request, res: Response) {
        try {
            const { chatId } = req.params;

            const chat = await chatModel.findById(chatId)
                .populate('messages.senderId', 'name email profilePicture')
                .populate('messages.receiverId', 'name email profilePicture');

            if (!chat) {
                return res.status(404).json({ 
                    success: false,
                    message: "Chat not found" 
                });
            }
            res.json({
                success: true,
                messages: chat.messages,
                chatId: chat._id
            });
        } catch (err: any) {
            console.error("Error fetching messages:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error",
                error: err.message 
            });
        }
    }
    // Add this new endpoint for user to get their chats
    async getUserChats(req: Request, res: Response) {
        try {
            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ 
                    success: false,
                    message: "User ID is required" 
                });
            }
            const chats = await chatModel.find({ 
                participants: new mongoose.Types.ObjectId(userId),
                isSupportChat: true 
            })
            .populate({
                path: 'participants',
                select: 'name email profilePicture isSupportAdmin',
                match: { isSupportAdmin: true }
            })
            .populate('lastMessage.senderId', 'name profilePicture')
            .sort({
                updatedAt: -1,
            })
            .limit(10);

            // Get support admin info for the sidebar
            const supportAdmin = await userModel.findOne({
                isSupportAdmin: true
            }).select('name email profilePicture');

            res.json({
                success: true,
                count: chats.length,
                chats,
                supportAdmin: supportAdmin || null
            });
        } catch (err: any) {
            console.error("Error getting user support chats:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error",
                error: err.message 
            });
        }
    }

    // Add this endpoint to mark messages as read
    async markAsRead(req: Request, res: Response) {
        try {
            const { chatId } = req.params;
            const { userId } = req.body;

            const chat = await chatModel.findById(chatId);
            
            if (!chat) {
                return res.status(404).json({ 
                    success: false,
                    message: "Chat not found" 
                });
            }

            // Mark all messages where user is receiver as read
            chat.messages.forEach(message => {
                if (message.receiverId.toString() === userId && !message.read) {
                    message.read = true;
                    message.readAt = new Date();
                }
            });

            await chat.save();

            res.json({
                success: true,
                message: "Messages marked as read"
            });
        } catch (err: any) {
            console.error("Error marking messages as read:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error",
                error: err.message 
            });
        }
    }
}

export const chatController = new ChatController();

chatModel.ts
import mongoose, { Schema, Document, model } from 'mongoose';
export interface IMessage {
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    message: string;
    type: string; // 'text', 'image', 'file'
    read: boolean;
    readAt?: Date;
    createdAt: Date;
}
export interface IChat extends Document {
    participants: mongoose.Types.ObjectId[];
    messages: IMessage[];
    isSupportChat: boolean;
    lastMessage?: IMessage;
    createdAt: Date;
    updatedAt: Date;
}
const messageSchema = new Schema<IMessage>({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'text'
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: { type: Date },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const chatSchema = new Schema<IChat>({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    messages: [messageSchema],
    
    isSupportChat: {
        type: Boolean,
        default: false
    },
    lastMessage: {
        type: messageSchema,
        default: null
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
chatSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (this.messages.length > 0) {
        this.lastMessage = this.messages[this.messages.length - 1];
    }
    next();
});

const chatModel = model<IChat>('Chat', chatSchema);
export { chatModel }

chatRouter.ts
// src/routes/chat.route.ts
import express from "express";
import { chatController } from "../controllers/chat.controller";
import { protect, refreshTokenProtect, authorizeRoles } from '../middleware/user.middleaware';
const chatRouter = express.Router();
chatRouter.post("/start", protect, chatController.startChat);
// chatRouter.get("/user/:userId", protect, chatController.getUserChats);
chatRouter.get("/user/:userId/support-chat", protect, chatController.getUserChats);

chatRouter.get("/:chatId/messages", protect, chatController.fetchMessages);
chatRouter.patch("/:chatId/read", protect, chatController.markAsRead);

// ADMIN 
chatRouter.get("/admin/list", protect, authorizeRoles('admin'), chatController.listAdminChats);

export { chatRouter }

socketServer.ts
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
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} connected`);
    });

    // Join Chat Room
    socket.on("join", ({ chatId, userId }) => {
      socket.join(chatId);
      socket.data.userId = userId;
    });

    // Send Message
    socket.on(
      "sendMessage",
      async (msg: {
        chatId: string;
        senderId: string;
        receiverId: string;
        message: string;
      }) => {
        try {
          const chat = await chatModel.findById(msg.chatId);
          if (!chat) return;

            // Validate participants
          const isValidParticipant = chat.participants.some(
            participant => participant.toString() === msg.senderId
          );

          if (!isValidParticipant) {
            console.error("Sender not in chat participants");
            return;
          }
          
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
          // Also notify the receiver if they're online
          const receiverSocketId = onlineUsers.get(msg.receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", {
              ...messageObj,
              chatId: msg.chatId,
              message: msg.message,
              senderId: msg.senderId,
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.log("Message error:", error);
        }
      }
    );
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
        const chat = await chatModel.findById(chatId);
        if (chat) {
             let hasUpdates = false;

          chat.messages.forEach(msg => {
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

        //   await chat.save();
        //   io.to(chatId).emit("messagesRead", { chatId, userId });
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

server.ts
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import http from "http";
import ejs from 'ejs'
import session from 'express-session';
import flash from 'connect-flash';
import cookieParser from "cookie-parser";
import MongoStore from 'connect-mongo';
import cors from 'cors'
import { connectDatabase } from './config/dbConnection';
import { createDefaultRoles } from './middleware/role.middleware';
import { swaggerSetup } from "./swagger";
import { Server } from "socket.io";
import { socketHandler } from './socketServer';
connectDatabase()
const app = express();
const server = http.createServer(app);
swaggerSetup(app);

// Routers

import { showRepository } from "./repository/show.repo";
import { homeRouter } from './routes/ejsRouter/auth.route';

import { chatRouter } from './routes/chat.route';

app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],

}))

// ---------------- Socket.IO Setup ----------------

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    // Add these for better stability
    pingTimeout: 60000,
    pingInterval: 25000,
});
socketHandler(io);

// Body Parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(createDefaultRoles);

//chat
app.use("/chat", chatRouter);

// console.log("RUNNING MODE:", process.env.NODE_ENV);

server.listen(process.env.PORT, () =>
    console.log(`Server is listening on port http://localhost:${process.env.PORT}`)
)


chat.ejs
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Chat - Cinema Management</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

    <!-- Socket.IO -->
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>

    
</head>

<body>
    <!-- Layout Wrapper -->
    <div id="layout-wrapper">
        <!-- Sidebar -->
        <div id="sidebar-wrapper">
            <%- include('./partials/sidebar.ejs') %>
        </div>

        <!-- Navbar -->
        <div id="navbar-wrapper">
            <%- include('./partials/navbar.ejs') %>
        </div>

        <!-- Main Content -->
        <div id="content-wrapper">
            <div class="chat-container">
                <!-- Chat Sidebar with User List -->
                <div class="chat-sidebar">
                    <!-- Sidebar Header -->
                    <div class="chat-sidebar-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <h4><i class="fas fa-comments me-2"></i>Chat Support</h4>
                            <div>
                                <span class="badge bg-light text-dark" id="active-users-count">0 Online</span>
                            </div>
                        </div>
                        <div class="mt-2 text-light" style="font-size: 14px;">
                            <span id="admin-name">
                       
                            </span>
                            <span class="badge bg-success ms-2">Support Admin</span>
                        </div>
                    </div>

                    <!-- Search Bar -->
                    <div class="chat-search">
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" class="form-control" id="search-chats" placeholder="Search chats...">
                        </div>
                    </div>

                    <!-- Chat List -->
                    <div class="chat-list" id="chat-list">
                        <!-- Chat items will be loaded here dynamically -->
                        <div class="empty-chat">
                            <div class="empty-chat-icon">
                                <i class="fas fa-comment-slash"></i>
                            </div>
                            <h4>No Chats Yet</h4>
                            <p class="text-muted">Start a conversation with your users</p>
                        </div>
                    </div>
                </div>

                <!-- Chat Main Area -->
                <div class="chat-main" id="chat-main">
                    <!-- Empty Chat State (No chat selected) -->
                    <div class="empty-chat" id="empty-chat-state">
                        <div class="empty-chat-icon">
                            <i class="fas fa-comment-alt"></i>
                        </div>
                        <h4>Welcome to Admin Chat</h4>
                        <p class="text-muted">Select a chat from the sidebar to start messaging</p>
                        <div class="mt-4">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="card border-0 shadow-sm">
                                        <div class="card-body text-center">
                                            <i class="fas fa-users fa-2x text-primary mb-3"></i>
                                            <h6>Active Users</h6>
                                            <p class="mb-0" id="total-active-users">0</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card border-0 shadow-sm">
                                        <div class="card-body text-center">
                                            <i class="fas fa-comments fa-2x text-success mb-3"></i>
                                            <h6>Total Chats</h6>
                                            <p class="mb-0" id="total-chats-count">0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Active Chat State (When chat is selected) -->
                    <div id="active-chat-state" style="display: none;">
                        <!-- Chat Header -->
                        <div class="chat-header">
                            <div class="chat-user-info">
                                <div class="chat-avatar" id="current-user-avatar">
                                    <!-- Avatar will be set dynamically -->
                                </div>
                                <div class="chat-user-details">
                                    <h6 id="current-user-name">User Name</h6>
                                    <p id="current-user-status">
                                        <span class="online-status offline">
                                            <i class="fas fa-circle" style="font-size: 0.7rem;"></i>
                                            <span class="status-text">Offline</span>
                                        </span>
                                        <span class="user-typing" id="typing-indicator" style="display: none;">
                                            is typing...
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div class="chat-header-actions">
                                <button class="btn btn-chat-action" title="Call">
                                    <i class="fas fa-phone"></i>
                                </button>
                                <button class="btn btn-chat-action" title="Video Call">
                                    <i class="fas fa-video"></i>
                                </button>
                                <button class="btn btn-chat-action" title="More options">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Messages Area -->
                        <div class="messages-area" id="messages-area">
                            <!-- Messages will be loaded here dynamically -->
                            <div class="empty-chat" id="no-messages-state">
                                <div class="empty-chat-icon">
                                    <i class="fas fa-comments"></i>
                                </div>
                                <h4>No messages yet</h4>
                                <p class="text-muted">Send a message to start the conversation</p>
                            </div>
                        </div>

                        <!-- Message Input Area -->
                        <div class="message-input-area">
                            <div class="message-input-wrapper">
                                <button type="button" class="btn-attachment" title="Attach file"
                                    onclick="document.getElementById('file-input').click()">
                                    <i class="fas fa-paperclip"></i>
                                </button>

                                <textarea class="message-input" id="message-input"
                                    placeholder="Type your message here..." rows="1" onkeydown="handleKeyPress(event)"
                                    oninput="handleTyping()"></textarea>

                                <div class="message-actions">
                                    <button type="button" class="btn-attachment" title="Emoji">
                                        <i class="fas fa-smile"></i>
                                    </button>
                                    <button type="button" class="btn-send" id="send-button" onclick="sendMessage()">
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Hidden file input -->
                            <input type="file" id="file-input" style="display: none;"
                                onchange="handleFileUpload(event)">

                            <div class="mt-2" id="file-preview" style="display: none;">
                                <small id="file-name" class="text-muted"></small>
                                <button type="button" class="btn btn-sm btn-link text-danger" onclick="clearFile()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // Global variables
        let socket = null;
        let adminId = '<%= admin._id %>';
        let currentChatId = null;
        let currentUserId = null;
        let onlineUsers = new Set();
        let typingTimeouts = {};

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function () {
            initializeSocket();
            loadChats();
            setInterval(loadChats, 30000); // Refresh chat list every 30 seconds
        });

        // Initialize Socket.IO connection
        function initializeSocket() {
            const socketUrl = window.location.origin;
            socket = io(socketUrl, {
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            socket.on('connect', () => {
                console.log('Socket connected:', socket.id);
                socket.emit('register', adminId);

                // Load online users
                updateOnlineUsers();
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socket.on('message', handleIncomingMessage);

            socket.on('typing', handleTypingIndicator);

            socket.on('messagesRead', handleMessagesRead);

            socket.on('userJoined', handleUserJoined);

            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                showNotification('Connection error. Please refresh the page.', 'error');
            });
        }

        // Load admin's chat list
        async function loadChats() {
            try {
                const response = await fetch(`/chat/admin/list?adminId=${adminId}`);
                const data = await response.json();

                if (data.success) {
                    renderChatList(data.chats);
                    document.getElementById('total-chats-count').textContent = data.chats.length;
                }
            } catch (error) {
                console.error('Error loading chats:', error);
            }
        }

        // Render chat list in sidebar
        function renderChatList(chats) {
            const chatList = document.getElementById('chat-list');

            if (chats.length === 0) {
                chatList.innerHTML = `
                    <div class="empty-chat">
                        <div class="empty-chat-icon">
                            <i class="fas fa-comment-slash"></i>
                        </div>
                        <h4>No Chats Yet</h4>
                        <p class="text-muted">Start a conversation with your users</p>
                    </div>
                `;
                return;
            }

            chatList.innerHTML = '';

            chats.forEach(chat => {
                // Find the other participant (not admin)
                const otherParticipant = chat.participants?.find(p => p._id !== adminId);
                const participant = otherParticipant || { name: 'User', profilePicture: '' };

                // Count unread messages
                const unreadCount = chat.messages?.filter(m =>
                    m.receiverId === adminId && !m.read
                ).length || 0;

                // Get last message
                const lastMessage = chat.lastMessage || (chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1] : null);
                const lastMessageText = lastMessage ?
                    (lastMessage.senderId === adminId ? 'You: ' : '') + lastMessage.message :
                    'No messages yet';

                // Format time
                const lastTime = lastMessage ? formatTime(lastMessage.createdAt) : '';

                // Check if user is online
                const isOnline = onlineUsers.has(participant._id);

                // Create avatar color based on user ID
                const avatarColor = stringToColor(participant._id || 'user');
                const avatarLetter = participant.name?.charAt(0).toUpperCase() || 'U';

                const chatItem = document.createElement('div');
                chatItem.className = `chat-list-item ${currentChatId === chat._id ? 'active' : ''}`;
                chatItem.innerHTML = `
                    <div class="chat-avatar" style="background-color: ${avatarColor};">
                        ${avatarLetter}
                        ${isOnline ? '<span class="position-absolute translate-middle p-1 bg-success border border-light rounded-circle" style="right: 0; bottom: 0;"></span>' : ''}
                    </div>
                    <div class="chat-info">
                        <div class="chat-info-header">
                            <div class="chat-user-name">
                                ${participant.name || 'User'}
                                ${isOnline ? '<i class="fas fa-circle text-success ms-1" style="font-size: 0.7rem;"></i>' : ''}
                            </div>
                            <div class="chat-time">
                                ${lastTime}
                            </div>
                        </div>
                        <div class="chat-preview">
                            ${lastMessageText}
                        </div>
                    </div>
                    ${unreadCount > 0 ? `<div class="chat-unread">${unreadCount}</div>` : ''}
                `;

                chatItem.onclick = () => selectChat(chat._id, participant);
                chatList.appendChild(chatItem);
            });
        }

        // Select a chat and load messages
        async function selectChat(chatId, user) {
            currentChatId = chatId;
            currentUserId = user._id;

            // Update UI
            document.getElementById('empty-chat-state').style.display = 'none';
            document.getElementById('active-chat-state').style.display = 'flex';
            document.getElementById('active-chat-state').style.flexDirection = 'column';

            // Update chat header
            const avatarColor = stringToColor(user._id || 'user');
            const avatarLetter = user.name?.charAt(0).toUpperCase() || 'U';

            document.getElementById('current-user-avatar').innerHTML = `
                ${avatarLetter}
                ${onlineUsers.has(user._id) ?
                    '<span class="position-absolute translate-middle p-1 bg-success border border-light rounded-circle" style="right: 0; bottom: 0;"></span>' :
                    ''}
            `;
            document.getElementById('current-user-avatar').style.backgroundColor = avatarColor;
            document.getElementById('current-user-name').textContent = user.name || 'User';

            // Update status
            const statusElement = document.getElementById('current-user-status');
            const isOnline = onlineUsers.has(user._id);
            statusElement.innerHTML = `
                <span class="online-status ${isOnline ? 'online' : 'offline'}">
                    <i class="fas fa-circle" style="font-size: 0.7rem;"></i> 
                    <span class="status-text">${isOnline ? 'Online' : 'Offline'}</span>
                </span>
                <span class="user-typing" id="typing-indicator" style="display: none;">
                    is typing...
                </span>
            `;

            // Join socket room
            if (socket) {
                socket.emit('join', { chatId, userId: adminId });
            }

            // Load messages
            await loadMessages(chatId);

            // Mark messages as read
            markMessagesAsRead();

            // Update chat list active state
            updateActiveChatInList();

            // Scroll to bottom
            setTimeout(() => {
                const messagesArea = document.getElementById('messages-area');
                messagesArea.scrollTop = messagesArea.scrollHeight;
            }, 100);
        }

        // Load messages for a chat
        async function loadMessages(chatId) {
            try {
                const response = await fetch(`/chat/${chatId}/messages`);
                const data = await response.json();

                if (data.success) {
                    renderMessages(data.messages);
                }
            } catch (error) {
                console.error('Error loading messages:', error);
                showNotification('Failed to load messages', 'error');
            }
        }

        // Render messages in chat area
        function renderMessages(messages) {
            const messagesArea = document.getElementById('messages-area');

            if (!messages || messages.length === 0) {
                document.getElementById('no-messages-state').style.display = 'flex';
                return;
            }

            document.getElementById('no-messages-state').style.display = 'none';

            // Group messages by date
            const groupedMessages = groupMessagesByDate(messages);
            messagesArea.innerHTML = '';

            // Render each date group
            Object.keys(groupedMessages).forEach(date => {
                // Date separator
                const dateSeparator = document.createElement('div');
                dateSeparator.className = 'date-separator';
                dateSeparator.innerHTML = `<span>${formatDate(date)}</span>`;
                messagesArea.appendChild(dateSeparator);

                // Messages for this date
                groupedMessages[date].forEach(message => {
                    const isAdminMessage = message.senderId === adminId;
                    const messageTime = formatTime(message.createdAt);

                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${isAdminMessage ? 'sent' : 'received'}`;

                    let readStatus = '';
                    if (isAdminMessage && message.read) {
                        readStatus = '<span class="message-read"><i class="fas fa-check-double"></i></span>';
                    }

                    messageDiv.innerHTML = `
                        <div class="message-content">
                            <div>${escapeHtml(message.message)}</div>
                            <div class="message-time">
                                ${messageTime} ${readStatus}
                            </div>
                        </div>
                    `;

                    messagesArea.appendChild(messageDiv);
                });
            });

            // Scroll to bottom
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }

        // Send message
        async function sendMessage() {
            const messageInput = document.getElementById('message-input');
            const message = messageInput.value.trim();

            if (!message || !currentChatId || !socket) {
                return;
            }

            // Create message data
            const messageData = {
                chatId: currentChatId,
                senderId: adminId,
                receiverId: currentUserId,
                message: message,
                type: 'text'
            };

            // Emit via socket
            socket.emit('sendMessage', messageData);

            // Clear input
            messageInput.value = '';
            messageInput.style.height = 'auto';

            // Add message to UI immediately
            const messagesArea = document.getElementById('messages-area');
            const messageTime = formatTime(new Date().toISOString());

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent';
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div>${escapeHtml(message)}</div>
                    <div class="message-time">
                        ${messageTime} <span class="message-read"><i class="fas fa-check"></i></span>
                    </div>
                </div>
            `;

            messagesArea.appendChild(messageDiv);

            // Remove "no messages" state if present
            document.getElementById('no-messages-state').style.display = 'none';

            // Scroll to bottom
            messagesArea.scrollTop = messagesArea.scrollHeight;

            // Clear typing indicator
            if (typingTimeouts[currentChatId]) {
                clearTimeout(typingTimeouts[currentChatId]);
                socket.emit('typing', {
                    chatId: currentChatId,
                    userId: adminId,
                    isTyping: false
                });
            }
        }

        // Handle incoming message
        function handleIncomingMessage(data) {
            if (data.chatId === currentChatId) {
                // Add message to current chat
                const messagesArea = document.getElementById('messages-area');
                const messageTime = formatTime(data.createdAt);

                const isAdminMessage = data.senderId === adminId;

                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${isAdminMessage ? 'sent' : 'received'}`;

                let readStatus = '';
                if (isAdminMessage && data.read) {
                    readStatus = '<span class="message-read"><i class="fas fa-check-double"></i></span>';
                }

                messageDiv.innerHTML = `
                    <div class="message-content">
                        <div>${escapeHtml(data.message)}</div>
                        <div class="message-time">
                            ${messageTime} ${readStatus}
                        </div>
                    </div>
                `;

                messagesArea.appendChild(messageDiv);
                document.getElementById('no-messages-state').style.display = 'none';

                // Scroll to bottom
                messagesArea.scrollTop = messagesArea.scrollHeight;

                // Mark as read if it's for admin
                if (data.receiverId === adminId) {
                    markMessagesAsRead();
                }
            }

            // Update chat list for this chat
            loadChats();
        }

        // Handle typing indicator
        function handleTypingIndicator(data) {
            if (data.chatId === currentChatId && data.userId !== adminId) {
                const typingIndicator = document.getElementById('typing-indicator');

                if (data.isTyping) {
                    typingIndicator.style.display = 'inline';
                } else {
                    typingIndicator.style.display = 'none';
                }
            }
        }

        // Handle key press for Enter to send
        function handleKeyPress(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }

        // Handle typing detection
        function handleTyping() {
            if (!currentChatId || !socket) return;

            // Clear previous timeout
            if (typingTimeouts[currentChatId]) {
                clearTimeout(typingTimeouts[currentChatId]);
            }

            // Emit typing start
            socket.emit('typing', {
                chatId: currentChatId,
                userId: adminId,
                isTyping: true
            });

            // Set timeout to stop typing indicator
            typingTimeouts[currentChatId] = setTimeout(() => {
                socket.emit('typing', {
                    chatId: currentChatId,
                    userId: adminId,
                    isTyping: false
                });
            }, 2000);
        }

        // Mark messages as read
        function markMessagesAsRead() {
            if (!currentChatId || !socket) return;

            socket.emit('markAsRead', {
                chatId: currentChatId,
                userId: adminId
            });

            // Update chat list to remove unread badge
            loadChats();
        }

        // Handle messages read event
        function handleMessagesRead(data) {
            if (data.chatId === currentChatId) {
                // Update read status for sent messages
                const messages = document.querySelectorAll('.message.sent .message-read');
                messages.forEach(msg => {
                    if (msg.querySelector('.fa-check')) {
                        msg.innerHTML = '<i class="fas fa-check-double"></i>';
                    }
                });
            }
        }

        // Handle user joined event
        function handleUserJoined(data) {
            if (data.userId === currentUserId) {
                // Update status to online
                updateUserOnlineStatus(true);
                onlineUsers.add(data.userId);
            }
        }

        // Update online users list
        function updateOnlineUsers() {
            // This would typically come from your backend
            // For now, we'll simulate with a periodic check
            setInterval(() => {
                // Update chat list to show online status
                loadChats();
            }, 10000);
        }

        // Update user online status in chat header
        function updateUserOnlineStatus(isOnline) {
            const statusElement = document.getElementById('current-user-status');
            statusElement.innerHTML = `
                <span class="online-status ${isOnline ? 'online' : 'offline'}">
                    <i class="fas fa-circle" style="font-size: 0.7rem;"></i> 
                    <span class="status-text">${isOnline ? 'Online' : 'Offline'}</span>
                </span>
                <span class="user-typing" id="typing-indicator" style="display: none;">
                    is typing...
                </span>
            `;
        }

        // Update active chat in list
        function updateActiveChatInList() {
            const chatItems = document.querySelectorAll('.chat-list-item');
            chatItems.forEach(item => {
                item.classList.remove('active');
            });

            if (currentChatId) {
                const activeItem = Array.from(chatItems).find(item =>
                    item.onclick && item.onclick.toString().includes(currentChatId)
                );
                if (activeItem) {
                    activeItem.classList.add('active');
                }
            }
        }

        // Handle file upload
        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const filePreview = document.getElementById('file-preview');
            const fileName = document.getElementById('file-name');

            fileName.textContent = file.name;
            filePreview.style.display = 'block';

            // You would typically upload the file to your server here
            // and then send the file URL as a message
        }

        // Clear file selection
        function clearFile() {
            document.getElementById('file-input').value = '';
            document.getElementById('file-preview').style.display = 'none';
        }

        // Show notification
        function showNotification(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            notification.style.cssText = `
                top: 20px;
                right: 20px;
                z-index: 9999;
                min-width: 300px;
            `;
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;

            document.body.appendChild(notification);

            // Auto remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        }

        // Helper function to generate color from string
        function stringToColor(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const color = Math.floor(Math.abs((Math.sin(hash) * 16777215) % 16777215));
            return '#' + color.toString(16).padStart(6, '0');
        }
        // Helper function to format time
        function formatTime(dateString) {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        // Helper function to format date
        function formatDate(dateString) {
            const date = new Date(dateString);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            } else {
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
        }
        // Helper function to group messages by date
        function groupMessagesByDate(messages) {
            const grouped = {};

            messages.forEach(message => {
                const date = new Date(message.createdAt).toDateString();
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(message);
            });

            return grouped;
        }
        // Helper function to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        // Search functionality
        document.getElementById('search-chats').addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const chatItems = document.querySelectorAll('.chat-list-item');

            chatItems.forEach(item => {
                const userName = item.querySelector('.chat-user-name').textContent.toLowerCase();
                const preview = item.querySelector('.chat-preview').textContent.toLowerCase();

                if (userName.includes(searchTerm) || preview.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    </script>
</body>

</html>