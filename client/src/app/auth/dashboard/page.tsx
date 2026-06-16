"use client";

import React, { useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
    IconButton, Container, Card, CardContent, Grid, TextField, Button, Chip, Divider, Paper, Dialog, DialogTitle,
    DialogContent, DialogActions, Badge, useTheme, useMediaQuery, Fab,
    ListItemButton
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home as HomeIcon,
    Person as PersonIcon,
    Receipt as OrderIcon,
    Help as HelpIcon,
    Edit as EditIcon,
    Chat as ChatIcon,
    Logout as LogoutIcon,
    CameraAlt as CameraIcon,
    CheckCircle as SuccessIcon,
    Theaters as MovieIcon
} from '@mui/icons-material';

interface ProfilePageProps {
    profileData: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    editMode: boolean;
    setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    setProfileData: React.Dispatch<React.SetStateAction<{
        name: string;
        email: string;
        phone: string;
        address: string;
    }>>;
}

// Main Dashboard Component
const BookMyCinemaDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activePage, setActivePage] = useState('home');
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 234 567 8900',
        address: '123 Cinema Street, Movie City'
    });

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // ✅ Add MouseEvent type
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        console.log('Logging out...');
    };

    // Drawer content
    const drawer = (
        <Box sx={{ width: 250, bgcolor: 'background.paper', height: '100%' }}>
            <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6" component="div">
                    BookMyCinema
                </Typography>
            </Box>
            <List>
                {[
                    { text: 'Home', icon: <HomeIcon />, key: 'home' },
                    { text: 'Profile', icon: <PersonIcon />, key: 'profile' },
                    { text: 'Your Order', icon: <OrderIcon />, key: 'orders' },
                    { text: 'Help Center', icon: <HelpIcon />, key: 'help' }
                ].map((item) => (
                    <ListItemButton
                        // component="div"
                        // button
                        key={item.key}
                        selected={activePage === item.key}
                        onClick={() => {
                            setActivePage(item.key);
                            if (isMobile) setMobileOpen(false);
                        }}
                        sx={{ cursor: 'pointer' }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - 250px)` },
                    ml: { md: `250px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                    </Typography>
                    <IconButton color="inherit" onClick={handleMenuOpen}>
                        <Avatar sx={{ width: 32, height: 32 }} src="/static/images/avatar.jpg" />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleMenuClose}>
                            <Avatar sx={{ width: 24, height: 24, mr: 1 }} />
                            Profile
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon sx={{ mr: 1 }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Box
                component="nav"
                sx={{ width: { md: 250 }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - 250px)` },
                    mt: 8
                }}
            >
                {activePage === 'home' && <HomePage />}
                {activePage === 'profile' && (
                    <ProfilePage
                        profileData={profileData}
                        editMode={editMode}
                        setEditMode={setEditMode}
                        setProfileData={setProfileData}
                    />
                )}
                {activePage === 'orders' && <OrdersPage />}
                {activePage === 'help' && <HelpCenterPage />}
            </Box>
        </Box>
    );
};

// Home Page Component
const HomePage = () => {
    return (
        <Container maxWidth="xl">
            <Typography variant="h4" gutterBottom>
                Welcome to BookMyCinema
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Your one-stop destination for movie bookings and entertainment.
            </Typography>

            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                mt: 2
            }}>
                <Box sx={{
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
                    minWidth: { xs: '100%', sm: '200px' }
                }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <MovieIcon color="primary" sx={{ fontSize: 48 }} />
                            <Typography variant="h6" gutterBottom>
                                Upcoming Movies
                            </Typography>
                            <Typography variant="body2">
                                Browse and book latest movies
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
                    minWidth: { xs: '100%', sm: '200px' }
                }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <OrderIcon color="secondary" sx={{ fontSize: 48 }} />
                            <Typography variant="h6" gutterBottom>
                                Your Bookings
                            </Typography>
                            <Typography variant="body2">
                                View your ticket history
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
                    minWidth: { xs: '100%', sm: '200px' }
                }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <SuccessIcon color="success" sx={{ fontSize: 48 }} />
                            <Typography variant="h6" gutterBottom>
                                Quick Book
                            </Typography>
                            <Typography variant="body2">
                                Fast and easy booking
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
                    minWidth: { xs: '100%', sm: '200px' }
                }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <HelpIcon color="action" sx={{ fontSize: 48 }} />
                            <Typography variant="h6" gutterBottom>
                                Support
                            </Typography>
                            <Typography variant="body2">
                                24/7 Customer help
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Container>
    );
};

// Profile Page Component
const ProfilePage = ({ profileData, editMode, setEditMode, setProfileData }: ProfilePageProps) => {
    const [tempData, setTempData] = useState(profileData);
    const [imageDialog, setImageDialog] = useState(false);

    const handleSave = () => {
        setProfileData(tempData);
        setEditMode(false);
    };

    const handleCancel = () => {
        setTempData(profileData);
        setEditMode(false);
    };

    return (
        <Container maxWidth="md">
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5">Profile Details</Typography>
                        {!editMode && (
                            <Button
                                startIcon={<EditIcon />}
                                variant="contained"
                                onClick={() => setEditMode(true)}
                            >
                                Edit Profile
                            </Button>
                        )}
                    </Box>

                    {/* Profile Image */}
                    <Box sx={{ textAlign: 'center', mb: 3, position: 'relative', display: 'inline-block' }}>
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                                <IconButton
                                    size="small"
                                    sx={{ bgcolor: 'primary.main', color: 'white' }}
                                    onClick={() => setImageDialog(true)}
                                >
                                    <CameraIcon />
                                </IconButton>
                            }
                        >
                            <Avatar
                                sx={{ width: 120, height: 120, mx: 'auto' }}
                                src="/static/images/avatar.jpg"
                            />
                        </Badge>
                    </Box>

                    {!editMode ? (
                        // View Mode
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3
                        }}>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                                <Typography variant="body1" gutterBottom>{profileData.name}</Typography>
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                <Typography variant="body1" gutterBottom>{profileData.email}</Typography>
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                <Typography variant="body1" gutterBottom>{profileData.phone}</Typography>
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                                <Typography variant="body1">{profileData.address}</Typography>
                            </Box>
                        </Box>
                    ) : (
                        // Edit Mode
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3
                        }}>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    value={tempData.name}
                                    onChange={(e) => setTempData({ ...tempData, name: e.target.value })}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={tempData.email}
                                    onChange={(e) => setTempData({ ...tempData, email: e.target.value })}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={tempData.phone}
                                    onChange={(e) => setTempData({ ...tempData, phone: e.target.value })}
                                />
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    multiline
                                    rows={2}
                                    value={tempData.address}
                                    onChange={(e) => setTempData({ ...tempData, address: e.target.value })}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 100%', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button variant="outlined" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button variant="contained" onClick={handleSave}>
                                    Update Profile
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Image Update Dialog */}
            <Dialog open={imageDialog} onClose={() => setImageDialog(false)}>
                <DialogTitle>Update Profile Image</DialogTitle>
                <DialogContent>
                    <Typography>Upload a new profile picture</Typography>
                    <Button variant="contained" component="label" sx={{ mt: 2 }}>
                        Upload Image
                        <input type="file" hidden accept="image/*" />
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImageDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => setImageDialog(false)}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

// Orders Page Component
const OrdersPage = () => {
    const orders = [
        {
            id: 1,
            movie: 'Avatar: The Way of Water',
            date: '2024-01-15',
            time: '7:00 PM',
            seats: ['A1', 'A2'],
            total: 2400,
            status: 'completed',
            cinema: 'PVR Cinemas'
        },
        {
            id: 2,
            movie: 'Spider-Man: No Way Home',
            date: '2024-01-10',
            time: '3:30 PM',
            seats: ['B5'],
            total: 1200,
            status: 'completed',
            cinema: 'INOX'
        }
    ];

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
                Your Orders
            </Typography>

            {orders.map((order) => (
                <Card key={order.id} sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 2
                        }}>
                            <Box sx={{
                                flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' },
                                minWidth: { xs: '100%', md: '200px' }
                            }}>
                                <Typography variant="h6" gutterBottom>
                                    {order.movie}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {order.cinema} • {order.date} • {order.time}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Seats: {order.seats.join(', ')}
                                </Typography>
                            </Box>
                            <Box sx={{
                                flex: { xs: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 8px)' },
                                minWidth: { xs: '100px', md: '120px' }
                            }}>
                                <Typography variant="h6" color="primary">
                                    ₹{order.total}
                                </Typography>
                            </Box>
                            <Box sx={{
                                flex: { xs: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 8px)' },
                                textAlign: { xs: 'right', md: 'right' },
                                minWidth: { xs: '100px', md: '120px' }
                            }}>
                                <Chip
                                    icon={<SuccessIcon />}
                                    label="Payment Successful"
                                    color="success"
                                    variant="outlined"
                                />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Container>
    );
};

// Help Center Page Component
const HelpCenterPage = () => {
    const [chatOpen, setChatOpen] = useState(false);

    const helpTopics = [
        { title: 'Payment & Refund', icon: '💳' },
        { title: 'Cancellation & Exchange', icon: '🔄' },
        { title: 'Cinema Queries', icon: '🎬' },
        { title: 'Ticket Booking Queries', icon: '🎫' }
    ];

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
                Help Center
            </Typography>

            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3
            }}>
                {/* Recent Bookings */}
                <Box sx={{
                    flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' },
                    minWidth: { xs: '100%', md: '300px' }
                }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Recent Bookings
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Avatar: The Way of Water"
                                        secondary="Jan 15, 2024 • 7:00 PM • PVR Cinemas"
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Spider-Man: No Way Home"
                                        secondary="Jan 10, 2024 • 3:30 PM • INOX"
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Box>

                {/* Find Your Ticket */}
                <Box sx={{
                    flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' },
                    minWidth: { xs: '100%', md: '300px' }
                }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Find Your Ticket Details
                            </Typography>
                            <TextField
                                fullWidth
                                label="Booking ID or Email"
                                variant="outlined"
                                size="small"
                                sx={{ mb: 2 }}
                            />
                            <Button variant="contained" fullWidth>
                                Search Ticket
                            </Button>
                        </CardContent>
                    </Card>
                </Box>

                {/* Help Topics */}
                <Box sx={{ flex: '1 1 100%' }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Top Help Topics
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 2
                            }}>
                                {helpTopics.map((topic, index) => (
                                    <Box sx={{
                                        flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 calc(33.33% - 12px)', md: '1 1 calc(25% - 12px)' },
                                        minWidth: { xs: '120px', sm: '150px' }
                                    }} key={index}>
                                        <Paper
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                        >
                                            <Typography variant="h4">{topic.icon}</Typography>
                                            <Typography variant="body2">{topic.title}</Typography>
                                        </Paper>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Chat with Admin */}
                <Box sx={{ flex: '1 1 100%' }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Need Immediate Help?
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Chat with our admin team for real-time assistance with your queries.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<ChatIcon />}
                                onClick={() => setChatOpen(true)}
                            >
                                Start Chat with Admin
                            </Button>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Chat Dialog */}
            <Dialog
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Chat with Admin
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ height: 300, border: '1px solid #ddd', p: 2, borderRadius: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                            Start chatting with our support team...
                        </Typography>
                    </Box>
                    <TextField
                        fullWidth
                        placeholder="Type your message here..."
                        variant="outlined"
                        size="small"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setChatOpen(false)}>Close</Button>
                    <Button variant="contained">Send Message</Button>
                </DialogActions>
            </Dialog>

            {/* Floating Chat Button for Mobile */}
            <Fab
                color="primary"
                aria-label="chat"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: { xs: 'flex', md: 'none' }
                }}
                onClick={() => setChatOpen(true)}
            >
                <ChatIcon />
            </Fab>
        </Container>
    );
};

export default BookMyCinemaDashboard;