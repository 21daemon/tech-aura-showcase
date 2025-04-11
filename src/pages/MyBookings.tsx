
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/transitions/PageTransition';
import ProgressPhotoGallery from '@/components/ProgressPhotoGallery';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Car, Clock, DollarSign, AlertCircle, Image, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState<string | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;

        console.log('Fetched bookings:', data);
        // Ensure data is always an array even if empty or null
        const bookingsArray = Array.isArray(data) ? data : [];
        setBookings(bookingsArray);
        
        // Set the first booking as active if available and in progress
        if (bookingsArray.length > 0) {
          const inProgressBooking = bookingsArray.find(b => b.status === 'in_progress');
          if (inProgressBooking) {
            setActiveBooking(inProgressBooking.id);
          } else {
            setActiveBooking(bookingsArray[0].id);
          }
        }
        
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: `Could not fetch bookings: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, toast]);
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-amber-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const switchToProgressTab = () => {
    // Use querySelector with optional chaining and fix the click method
    const tabElement = document.querySelector('[data-value="progress"]') as HTMLButtonElement;
    if (tabElement) {
      tabElement.click();
    }
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingToDelete)
        .eq('user_id', user?.id); // Ensure users can only delete their own bookings
      
      if (error) throw error;
      
      // Remove the deleted booking from the local state
      setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingToDelete));
      
      // If the deleted booking was active, clear the active booking
      if (activeBooking === bookingToDelete) {
        setActiveBooking(null);
      }
      
      // Close the dialog
      setBookingToDelete(null);
      setSelectedBooking(null);
      
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully",
      });
      
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: `Could not cancel booking: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const viewBookingDetails = (booking: any) => {
    setSelectedBooking(booking);
  };

  // Check if bookings is undefined or not an array, and default to empty array
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PageTransition>
        <div className="container mx-auto px-4 py-8 flex-grow">
          <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

          {loading ? (
            <div className="w-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : safeBookings.length === 0 ? (
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle>No bookings found</AlertTitle>
              <AlertDescription>
                You haven't made any bookings yet. 
                <a href="/booking" className="underline ml-1 text-amber-400 hover:text-amber-300">
                  Book a service now
                </a>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-8">
              <Tabs 
                defaultValue="bookings" 
                className="w-full"
                value={activeBooking ? "progress" : "bookings"}
                onValueChange={(value) => {
                  if (value === "bookings") {
                    setActiveBooking(null);
                  } else if (value === "progress" && !activeBooking && safeBookings.length > 0) {
                    setActiveBooking(safeBookings[0].id);
                  }
                }}
              >
                <TabsList className="mb-6">
                  <TabsTrigger value="bookings">All Bookings</TabsTrigger>
                  <TabsTrigger value="progress" className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    Progress Photos
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="bookings">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {safeBookings.map((booking) => (
                      <Card key={booking.id} className="bg-luxury-800/50 backdrop-blur-sm border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{booking.service_name}</CardTitle>
                            <Badge className={`${getStatusColor(booking.status)} text-white`}>
                              {booking.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-amber-500" />
                              <span className="text-sm text-white/80">{formatDate(booking.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              <span className="text-sm text-white/80">{booking.time_slot}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-amber-500" />
                              <span className="text-sm text-white/80">{booking.car_make} {booking.car_model}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-amber-500" />
                              <span className="text-sm text-white/80">{booking.price}</span>
                            </div>
                          </div>
                          
                          {booking.status === 'in_progress' && (
                            <div 
                              className="mt-2 text-center p-2 bg-amber-500/20 text-amber-400 rounded-md cursor-pointer hover:bg-amber-500/30 transition-colors"
                              onClick={() => {
                                setActiveBooking(booking.id);
                                // Switch to progress tab
                                switchToProgressTab();
                              }}
                            >
                              View Progress Photos
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2 border-t border-white/10">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-white/70 hover:text-white hover:bg-white/10"
                            onClick={() => viewBookingDetails(booking)}
                          >
                            View Details
                          </Button>
                          
                          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-luxury-800 border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Cancel Booking</AlertDialogTitle>
                                  <AlertDialogDescription className="text-white/70">
                                    Are you sure you want to cancel this booking? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/10">Keep Booking</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-500 text-white hover:bg-red-600"
                                    onClick={() => {
                                      setBookingToDelete(booking.id);
                                      handleDeleteBooking();
                                    }}
                                  >
                                    Cancel Booking
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="progress">
                  {activeBooking ? (
                    <div className="space-y-6">
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {safeBookings.map((booking) => (
                            <Badge
                              key={booking.id}
                              variant={activeBooking === booking.id ? "default" : "outline"}
                              className={`cursor-pointer ${
                                activeBooking === booking.id 
                                  ? 'bg-amber-500 hover:bg-amber-600 text-black' 
                                  : 'hover:bg-white/10'
                              }`}
                              onClick={() => setActiveBooking(booking.id)}
                            >
                              {booking.car_make} {booking.car_model} - {formatDate(booking.date)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <ProgressPhotoGallery bookingId={activeBooking} />
                    </div>
                  ) : (
                    <Alert className="bg-amber-500/10 border-amber-500/30">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertTitle>No booking selected</AlertTitle>
                      <AlertDescription>
                        Select a booking to view progress photos
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </PageTransition>
      
      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <DialogContent className="bg-luxury-800 border-white/10 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <span>{selectedBooking.service_name}</span>
                <Badge className={`${getStatusColor(selectedBooking.status)} text-white ml-2`}>
                  {selectedBooking.status.replace('_', ' ')}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Booking details for {selectedBooking.car_make} {selectedBooking.car_model}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
              <div className="space-y-4">
                <div className="bg-luxury-900/50 p-4 rounded-lg border border-white/10">
                  <h3 className="font-medium text-white mb-3">Appointment Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <span className="text-white/80">{formatDate(selectedBooking.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-white/80">{selectedBooking.time_slot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-amber-500" />
                      <span className="text-white/80">{selectedBooking.price}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-luxury-900/50 p-4 rounded-lg border border-white/10">
                  <h3 className="font-medium text-white mb-3">Vehicle Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Car className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div>
                        <div className="text-white/80">{selectedBooking.car_make} {selectedBooking.car_model}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Cancel Booking
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-luxury-800 border-white/10">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Cancel Booking</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/70">
                        Are you sure you want to cancel this booking? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/10">
                        Keep Booking
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          setBookingToDelete(selectedBooking.id);
                          handleDeleteBooking();
                        }}
                      >
                        Cancel Booking
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              {selectedBooking.status === 'in_progress' && (
                <Button
                  className="bg-amber-500 text-black hover:bg-amber-600"
                  onClick={() => {
                    setActiveBooking(selectedBooking.id);
                    setSelectedBooking(null);
                    // Use setTimeout to allow the dialog to close before switching tabs
                    setTimeout(() => {
                      switchToProgressTab();
                    }, 100);
                  }}
                >
                  <Image className="h-4 w-4 mr-1" />
                  View Progress Photos
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      <Footer />
    </div>
  );
};

export default MyBookings;
