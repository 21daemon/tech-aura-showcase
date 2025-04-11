
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ManageBookings from '@/components/admin/ManageBookings';
import DataAnalytics from '@/components/admin/DataAnalytics';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    fetchFeedback();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all bookings with their emails directly if available
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, profiles(id, full_name, email)')
        .order('date', { ascending: false });
        
      if (bookingsError) throw bookingsError;
      
      console.log("Raw bookings data:", bookingsData);
      
      // Process the bookings to ensure all data is properly structured
      const processedBookings = bookingsData?.map(booking => {
        // Make sure profiles is properly formatted - in some cases it might be null
        const processedBooking = {
          ...booking,
          profiles: booking.profiles || null
        };
        
        return processedBooking;
      }) || [];
      
      console.log("Processed bookings:", processedBookings);
      setBookings(processedBookings);
      
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log("Fetched feedback:", data);
      setFeedback(data || []);
      
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback data. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DataAnalytics 
              bookings={bookings} 
              feedback={feedback} 
            />
          </div>
          
          <ManageBookings 
            bookings={bookings} 
            onRefresh={fetchBookings} 
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AdminDashboard;
