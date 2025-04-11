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
      
      // Get all bookings with associated profiles
      let { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:profiles(id, full_name, email)
        `)
        .order('date', { ascending: false });
        
      if (bookingsError) throw bookingsError;
      
      console.log("Raw bookings data:", bookingsData);
      
      // For each booking, ensure we have an email field directly on the booking object
      const enhancedBookings = await Promise.all((bookingsData || []).map(async (booking) => {
        // If profiles contains email, add it directly to booking object
        if (booking.profiles && booking.profiles.email) {
          return {
            ...booking,
            email: booking.profiles.email
          };
        }
        
        // Otherwise, try to fetch the user's email separately
        try {
          // First try to get email from profiles table by user_id
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', booking.user_id)
            .single();
          
          if (!userError && userData && userData.email) {
            return {
              ...booking,
              email: userData.email
            };
          }
          
          // If we couldn't get from profiles, try directly from auth schema via edge function
          // This is a fallback mechanism
          const { data: authUserData, error: authError } = await supabase.functions.invoke('execute-sql', {
            body: {
              query_text: `
                SELECT email 
                FROM auth.users 
                WHERE id = $1::uuid
              `,
              query_params: [booking.user_id]
            }
          });
          
          if (!authError && authUserData && authUserData.length > 0) {
            return {
              ...booking,
              email: authUserData[0].email
            };
          }
        } catch (error) {
          console.error("Error fetching email for booking:", error);
        }
        
        // If all attempts fail, return booking without email
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
