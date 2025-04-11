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
      
      // First, get all bookings with profile data when available
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, profiles:profiles(id, full_name, email)')
        .order('date', { ascending: false });
        
      if (bookingsError) throw bookingsError;
      
      console.log("Raw bookings data:", bookingsData);
      
      // Now, supplement email information for bookings without profiles
      const enhancedBookings = await Promise.all((bookingsData || []).map(async (booking) => {
        // If we already have profile email info, use it
        if (booking.profiles && booking.profiles.email) {
          return booking;
        }
        
        // Otherwise, try to find user email directly from auth.users via an edge function
        try {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', booking.user_id)
            .single();
            
          if (!userError && userData) {
            return {
              ...booking,
              email: userData.email
            };
          }
        } catch (error) {
          console.error("Error fetching user email for booking:", error);
        }
        
        return booking;
      }));
      
      console.log("Enhanced bookings with emails:", enhancedBookings);
      setBookings(enhancedBookings);
      
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
