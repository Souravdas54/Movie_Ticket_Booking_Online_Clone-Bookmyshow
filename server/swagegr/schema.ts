/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "User registered successfully"
 *         data:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "65f8a7b9c1d2e3f4a5b6c7d8"
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john@example.com"
 *             phone:
 *               type: string
 *               example: "+8801712345678"
 *             gender:
 *               type: string
 *               example: "male"
 *             profilePicture:
 *               type: string
 *               example: "https://example.com/profile.jpg"
 *             isVerified:
 *               type: boolean
 *               example: false
 *             role:
 *               type: string
 *               example: "user"
 *             createdAt:
 *               type: string
 *               example: "2024-03-19T10:30:00.000Z"
 *             updatedAt:
 *               type: string
 *               example: "2024-03-19T10:30:00.000Z"
 * 
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Login successful"
 *         data:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "65f8a7b9c1d2e3f4a5b6c7d8"
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john@example.com"
 *             phone:
 *               type: string
 *               example: "+8801712345678"
 *             profilePicture:
 *               type: string
 *               example: "https://example.com/profile.jpg"
 *             isVerified:
 *               type: boolean
 *               example: true
 *             role:
 *               type: string
 *               example: "user"
 *         tokens:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             refreshToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             accessTokenExpires:
 *               type: string
 *               example: "2024-03-19T11:30:00.000Z"
 *             refreshTokenExpires:
 *               type: string
 *               example: "2024-04-19T10:30:00.000Z"
 * 
 *     RefreshResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Token refreshed successfully"
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             refreshToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             accessTokenExpires:
 *               type: string
 *               example: "2024-03-19T11:30:00.000Z"
 *             refreshTokenExpires:
 *               type: string
 *               example: "2024-04-19T10:30:00.000Z"
 */