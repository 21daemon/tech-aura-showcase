
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
      
      // Modify the query to avoid using the join that's causing the error
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      // If we successfully get bookings, now let's fetch the related profiles in a separate query
      if (data && data.length > 0) {
        // Get unique user IDs from bookings
        const userIds = [...new Set(data.map(booking => booking.user_id))];
        
        // Fetch profiles for those users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
          
        if (profilesError) console.error("Error fetching profiles:", profilesError);
        
        // Create a map of user_id to profile data for quick lookup
        const profilesMap = (profilesData || []).reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {});
        
        // Attach profile data to each booking
        const bookingsWithProfiles = data.map(booking => ({
          ...booking,
          profiles: profilesMap[booking.user_id] || null
        }));
        
        console.log("Fetched bookings with profiles:", bookingsWithProfiles);
        setBookings(bookingsWithProfiles);
      } else {
        setBookings(data || []);
      }
      
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
