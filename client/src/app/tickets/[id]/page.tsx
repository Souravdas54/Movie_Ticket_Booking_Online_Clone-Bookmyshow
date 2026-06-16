"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container, Paper, Typography, Box, Card, CardContent,
    Chip, Divider, Button, Alert, CircularProgress,
    Stack, Avatar, LinearProgress, List, ListItem, ListItemIcon,
    ListItemText, IconButton
} from '@mui/material';
import {
    ArrowBack, Download, Print, Share, LocalMovies,
    LocationOn, ConfirmationNumber, Schedule, Chair,
    CalendarToday, Payment, VerifiedUser, QrCode2,
    Restaurant, Warning, Phone, Email, Person
} from '@mui/icons-material';
import { checkBookingStatus } from '@/app/api/payment.endpoint';
import { QRCodeSVG } from 'qrcode.react';

// Types
interface BookingDetails {
    _id: string;
    movie?: {
        moviename: string;
        genre?: string[];
        duration?: number;
        language?: string;
        rating?: string;
        posterUrl?: string;
    };
    theater?: {
        theatername: string;
        address?: string;
        district?: string;
        city?: string;
        facilities?: string[];
    };
    show?: {
        date: string;
        timeSlots?: Array<{ time: string }>;
        room?: string;
        screen?: string;
        format?: string; // 2D, 3D, IMAX
    };
    seats: string[];
    totalAmount: number;
    paymentStatus: string;
    bookingStatus: string;
    bookingDate: string;
    userId?: string;
    userDetails?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    qrCodeData?: string;
    paymentMethod?: string;
    bookingReference?: string;
    snacks?: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
}

export default function TicketPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;

    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [qrValue, setQrValue] = useState('');

    useEffect(() => {
        if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
            router.push('/');
            return;
        }

        const fetchBooking = async () => {
            try {
                setLoading(true);
                const response = await checkBookingStatus(bookingId);

                if (response.success) {
                    const bookingData = response.data;
                    setBooking(bookingData);

                    // Generate QR code value
                    const qrData = JSON.stringify({
                        bookingId: bookingData._id,
                        movie: bookingData.movie?.moviename,
                        theater: bookingData.theater?.theatername,
                        showDate: bookingData.show?.date,
                        seats: bookingData.seats,
                        userId: bookingData.userId,
                        timestamp: new Date().toISOString()
                    });
                    setQrValue(qrData);
                } else {
                    setError(response.message || 'Failed to load ticket details');
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message || 'Failed to load ticket details');
                } else {
                    setError('Failed to load ticket details');

                }
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId, router]);

    const handlePrint = () => {
        const printContent = document.getElementById('ticket-content');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Ticket - ${booking?.movie?.moviename || 'Movie Ticket'}</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .ticket { border: 2px dashed #3b82f6; padding: 20px; max-width: 600px; margin: 0 auto; }
                                .header { text-align: center; margin-bottom: 20px; }
                                .section { margin: 15px 0; }
                                .qr-code { text-align: center; margin: 20px 0; }
                                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                            </style>
                        </head>
                        <body>
                            ${printContent.innerHTML}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    const downloadQRCode = () => {
        const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = `ticket-${bookingId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const downloadTicket = () => {
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                <h2 style="color: #3b82f6; text-align: center;">${booking?.movie?.moviename || 'Movie Ticket'}</h2>
                <p>Booking ID: ${booking?._id}</p>
                <p>Theater: ${booking?.theater?.theatername}</p>
                <p>Date: ${getFormattedDate()}</p>
                <p>Time: ${getShowTime()}</p>
                <p>Seats: ${booking?.seats?.join(', ') || 'N/A'}</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
        `;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(element.innerHTML);
            win.document.close();
            win.print();
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Ticket for ${booking?.movie?.moviename || 'Movie'}`,
                    text: `I'm going to watch ${booking?.movie?.moviename} at ${booking?.theater?.theatername}!`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Ticket link copied to clipboard!');
        }
    };

    const getShowTime = () => {
        if (!booking?.show?.timeSlots) return 'Time not specified';

        if (Array.isArray(booking.show.timeSlots) && booking.show.timeSlots.length > 0) {
            const firstTimeSlot = booking.show.timeSlots[0];
            if (firstTimeSlot && typeof firstTimeSlot === 'object' && 'time' in firstTimeSlot) {
                const time = firstTimeSlot.time;
                // Format time if needed
                return time.includes('AM') || time.includes('PM') ? time : `${time} PM`;
            }
        }

        return 'Time not specified';
    };

    const getFormattedDate = () => {
        if (!booking?.show?.date) return 'Date not specified';

        try {
            const date = new Date(booking.show.date);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return booking.show.date;
        }
    };

    const getMovieDuration = () => {
        if (!booking?.movie?.duration) return 'N/A';
        const hours = Math.floor(booking.movie.duration / 60);
        const minutes = booking.movie.duration % 60;
        return `${hours}h ${minutes}m`;
    };

    const calculateTotal = () => {
        let total = booking?.totalAmount || 0;
        if (booking?.snacks) {
            booking.snacks.forEach(snack => {
                total += snack.price * snack.quantity;
            });
        }
        return total;
    };

    if (loading) {
        return (
            <Container sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '80vh',
                flexDirection: 'column',
                gap: 2
            }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                    Loading your ticket...
                </Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ py: 4 }}>
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => router.push('/bookings')}
                        >
                            View Bookings
                        </Button>
                    }
                >
                    {error}
                </Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                    variant="contained"
                >
                    Go Back
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header with Actions */}
            <Box sx={{
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.push('/bookings')}
                    variant="outlined"
                    size="large"
                >
                    My Bookings
                </Button>

                <Typography variant="h4" sx={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #3b82f6 30%, #1d4ed8 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center'
                }}>
                    🎟️ Your Movie Ticket
                </Typography>

                <Stack direction="row" spacing={1}>
                    <Button
                        startIcon={<Print />}
                        onClick={handlePrint}
                        variant="outlined"
                        size="large"
                    >
                        Print
                    </Button>
                    <Button
                        startIcon={<Download />}
                        onClick={downloadTicket}
                        variant="outlined"
                        size="large"
                    >
                        PDF
                    </Button>
                    <Button
                        startIcon={<Share />}
                        onClick={handleShare}
                        variant="contained"
                        size="large"
                        sx={{ bgcolor: '#3b82f6' }}
                    >
                        Share
                    </Button>
                </Stack>
            </Box>

            {/* Payment Status Banner */}
            {booking?.paymentStatus === 'Paid' && (
                <Alert
                    icon={<VerifiedUser />}
                    severity="success"
                    sx={{
                        mb: 3,
                        '& .MuiAlert-icon': { fontSize: '2rem' }
                    }}
                    action={
                        <Chip
                            label="PAID"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                        />
                    }
                >
                    <Typography variant="h6">
                        Payment Successful! Your booking is confirmed.
                    </Typography>
                    <Typography variant="body2">
                        Booking reference: {booking?.bookingReference || booking?._id}
                    </Typography>
                </Alert>
            )}

            {/* Main Ticket Card */}
            <Card
                elevation={6}
                sx={{
                    borderRadius: 3,
                    overflow: 'visible',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '95%',
                        height: '10px',
                        backgroundColor: '#3b82f6',
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10
                    }
                }}
                id="ticket-content"
            >
                <CardContent sx={{ p: 4 }}>
                    {/* Ticket Header */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h3" sx={{
                            fontWeight: 'bold',
                            mb: 1,
                            color: '#1e40af'
                        }}>
                            {booking?.movie?.moviename || 'Movie Name'}
                        </Typography>
                        <Chip
                            icon={<LocalMovies />}
                            label={booking?.movie?.rating || 'U/A'}
                            color="primary"
                            sx={{ fontWeight: 'bold', px: 2 }}
                        />
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            Booking ID: <strong>{booking?._id}</strong>
                        </Typography>
                    </Box>

                    {/* Main Ticket Content - Using Flexbox instead of Grid */}
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                        width: '100%'
                    }}>
                        {/* Left Column - Movie & Show Details */}
                        <Box sx={{
                            flex: '1 1 60%',
                            minWidth: '300px'
                        }}>
                            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                                <Typography variant="h5" gutterBottom sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 3
                                }}>
                                    <LocalMovies /> Movie Details
                                </Typography>

                                <Box sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 3
                                }}>
                                    <Box sx={{ flex: '1 1 40%' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Genre
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {booking?.movie?.genre?.join(', ') || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: '1 1 40%' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Duration
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {getMovieDuration()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: '1 1 40%' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Language
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {booking?.movie?.language || 'English'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: '1 1 40%' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Format
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {booking?.show?.format || '2D'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                {/* Show Time Details */}
                                <Typography variant="h5" gutterBottom sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 3
                                }}>
                                    <Schedule /> Show Information
                                </Typography>

                                <Box sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 3
                                }}>
                                    <Box sx={{ flex: '1 1 40%' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ bgcolor: '#3b82f6' }}>
                                                <CalendarToday />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Date
                                                </Typography>
                                                <Typography variant="h6">
                                                    {getFormattedDate()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ flex: '1 1 40%' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ bgcolor: '#3b82f6' }}>
                                                <Schedule />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Time
                                                </Typography>
                                                <Typography variant="h6">
                                                    {getShowTime()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                {/* Theater Details */}
                                <Typography variant="h5" gutterBottom sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 3
                                }}>
                                    <LocationOn /> Theater Details
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                                    <Avatar sx={{ bgcolor: '#10b981' }}>
                                        <LocationOn />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">
                                            {booking?.theater?.theatername}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {booking?.theater?.address || booking?.theater?.city || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Screen: {booking?.show?.screen || '1'} • Room: {booking?.show?.room || 'Standard'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {booking?.theater?.facilities && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Facilities:
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            {booking.theater.facilities.map((facility, index) => (
                                                <Chip
                                                    key={index}
                                                    label={facility}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Paper>
                        </Box>

                        {/* Right Column - Seats & QR Code */}
                        <Box sx={{
                            flex: '1 1 35%',
                            minWidth: '280px'
                        }}>
                            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                                {/* Seats Section */}
                                <Typography variant="h5" gutterBottom sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 3
                                }}>
                                    <Chair /> Your Seats
                                </Typography>

                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        gap: 1.5,
                                        flexWrap: 'wrap',
                                        justifyContent: 'center'
                                    }}>
                                        {booking?.seats?.map((seat, index) => (
                                            <Chip
                                                key={index}
                                                label={seat}
                                                sx={{
                                                    bgcolor: '#1e40af',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem',
                                                    px: 2,
                                                    py: 2,
                                                    minWidth: '70px'
                                                }}
                                                icon={<Chair style={{ color: 'white' }} />}
                                            />
                                        ))}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                        Total {booking?.seats?.length || 0} seat(s) selected
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                {/* QR Code Section */}
                                <Typography variant="h5" gutterBottom sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 3,
                                    justifyContent: 'center'
                                }}>
                                    <QrCode2 /> Entry QR Code
                                </Typography>

                                <Box sx={{
                                    textAlign: 'center',
                                    p: 3,
                                    bgcolor: '#f8fafc',
                                    borderRadius: 2,
                                    border: '2px dashed #d1d5db'
                                }}>
                                    {qrValue ? (
                                        <>
                                            <QRCodeSVG
                                                id="qr-code-canvas"
                                                value={qrValue}
                                                size={200}
                                                level="H"
                                                includeMargin
                                                style={{ margin: '0 auto' }}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                                Scan at theater entrance
                                            </Typography>
                                            <Button
                                                startIcon={<Download />}
                                                onClick={downloadQRCode}
                                                variant="outlined"
                                                size="small"
                                                sx={{ mt: 2 }}
                                            >
                                                Download QR Code
                                            </Button>
                                        </>
                                    ) : (
                                        <Typography color="text.secondary">
                                            QR Code generating...
                                        </Typography>
                                    )}
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                {/* Payment Summary */}
                                <Typography variant="h5" gutterBottom sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 2
                                }}>
                                    <Payment /> Payment Summary
                                </Typography>

                                <List dense>
                                    <ListItem>
                                        <ListItemText
                                            primary="Ticket Amount"
                                            secondary={`${booking?.seats?.length || 0} seat(s)`}
                                        />
                                        <Typography fontWeight="bold">
                                            ₹{booking?.totalAmount || 0}
                                        </Typography>
                                    </ListItem>
                                    {booking?.snacks?.map((snack, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={`${snack.name} (x${snack.quantity})`}
                                            />
                                            <Typography>
                                                ₹{snack.price * snack.quantity}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                    <ListItem sx={{ bgcolor: '#f0f9ff', borderRadius: 1, mt: 1 }}>
                                        <ListItemText
                                            primary="Total Paid"
                                            primaryTypographyProps={{ fontWeight: 'bold' }}
                                        />
                                        <Typography variant="h6" color="#1e40af">
                                            ₹{calculateTotal()}
                                        </Typography>
                                    </ListItem>
                                </List>
                            </Paper>
                        </Box>
                    </Box>

                    {/* User Details */}
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 4, bgcolor: '#f0f9ff' }}>
                        <Typography variant="h5" gutterBottom sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <Person /> Customer Information
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3
                        }}>
                            <Box sx={{ flex: '1 1 25%', minWidth: '150px' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Name
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {booking?.userDetails?.name || 'N/A'}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: '1 1 25%', minWidth: '150px' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Email
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {booking?.userDetails?.email || 'N/A'}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: '1 1 25%', minWidth: '150px' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Phone
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {booking?.userDetails?.phone || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Important Instructions */}
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 4, bgcolor: '#fff7ed' }}>
                        <Typography variant="h5" gutterBottom sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: '#ea580c'
                        }}>
                            <Warning /> Important Instructions
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2
                        }}>
                            <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Schedule />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Arrive Early"
                                            secondary="Please arrive at least 30 minutes before showtime"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <ConfirmationNumber />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Valid ID Required"
                                            secondary="Carry the same ID used for booking"
                                        />
                                    </ListItem>
                                </List>
                            </Box>
                            <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Phone />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Support"
                                            secondary="Contact: 1800-123-4567"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Email />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Email"
                                            secondary="support@cinemabooking.com"
                                        />
                                    </ListItem>
                                </List>
                            </Box>
                        </Box>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Tickets are non-refundable and non-transferable. Entry may be refused if the QR code is tampered with.
                        </Alert>
                    </Paper>

                    {/* Footer */}
                    <Box sx={{ textAlign: 'center', mt: 4, pt: 2, borderTop: '1px dashed #d1d5db' }}>
                        <Typography variant="body2" color="text.secondary">
                            Thank you for booking with us! Enjoy your movie experience 🍿
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Booking confirmed on: {new Date(booking?.bookingDate || Date.now()).toLocaleString()}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Action Buttons Footer */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 3,
                mt: 4,
                flexWrap: 'wrap'
            }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => router.push('/movies')}
                    sx={{
                        bgcolor: '#10b981',
                        '&:hover': { bgcolor: '#0da271' }
                    }}
                >
                    Book Another Movie
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    onClick={() => router.push('/bookings')}
                >
                    View All Bookings
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    onClick={handlePrint}
                    startIcon={<Print />}
                >
                    Print Ticket
                </Button>
            </Box>
        </Container>
    );
}