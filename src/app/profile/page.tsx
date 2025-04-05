"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { supabase } from "@/lib/supabase";
import { Camera, Upload, X, Lock, Calendar, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import imageCompression from 'browser-image-compression';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5 } 
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20 
    } 
  }
};

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setFirstName(user.user_metadata?.first_name || "");
      setLastName(user.user_metadata?.last_name || "");
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
  }, [user]);

  // Fallback to database if metadata is missing
  useEffect(() => {
    // Only fetch from database if metadata is missing and we have a user
    if (user && (!firstName || !lastName)) {
      const fetchUserData = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user data:', error);
            return;
          }
          
          if (data) {
            // Update state with database values if they exist
            if (data.first_name && !firstName) setFirstName(data.first_name);
            if (data.last_name && !lastName) setLastName(data.last_name);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      
      fetchUserData();
    }
  }, [user, firstName, lastName]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null); // Clear previous messages
    setLoading(true); // Show loading indicator during potential compression

    console.log(`Original file size: ${file.size / 1024 / 1024} MB`);

    const options = {
      maxSizeMB: 10, // Set max size to 10MB
      maxWidthOrHeight: 1920, // Optional: limit resolution
      useWebWorker: true, // Use multi-threading for faster compression
      onProgress: (p: number) => { // Optional: log progress
        console.log(`Compression Progress: ${p}%`);
      }
    };

    try {
      let processedFile = file;
      // Check if compression is needed
      if (file.size > options.maxSizeMB * 1024 * 1024) {
        console.log('File size exceeds 10MB, attempting compression...');
        setMessage({ type: "success", text: "Image is large, compressing..." }); // Inform user
        processedFile = await imageCompression(file, options);
        console.log(`Compressed file size: ${processedFile.size / 1024 / 1024} MB`);
        setMessage({ type: "success", text: "Compression complete." }); // Update user
      } else {
        console.log('File size is within limits, no compression needed.');
      }

      setAvatarFile(processedFile);

      // Clean up previous object URL to avoid memory leaks
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
      
      // Create a new preview URL for the processed file
      const objectUrl = URL.createObjectURL(processedFile);
      setAvatarUrl(objectUrl);

    } catch (error) {
      console.error('Error during image processing:', error);
      setMessage({ type: "error", text: "Could not process image. Please try a different file." });
      // Reset if there was an error
      removeSelectedImage(); 
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  const removeSelectedImage = () => {
    setAvatarFile(null);
    if (!user?.user_metadata?.avatar_url) {
      setAvatarUrl(null);
    } else {
      // Revert to the current saved avatar
      setAvatarUrl(user.user_metadata.avatar_url);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return user?.user_metadata?.avatar_url || null;
    
    setUploading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${user?.id}/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatarFile);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Upload avatar if a new one was selected
      let newAvatarUrl = user?.user_metadata?.avatar_url || null;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      }

      // Update user profile with new data
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          avatar_url: newAvatarUrl,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
        // Reset the file input
        setAvatarFile(null);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center gap-3">
          <motion.div 
            className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          ></motion.div>
          <motion.div 
            className="text-primary/80 font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Loading profile...
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background with enhanced overlay gradient */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-purple-900/20 to-blue-900/20"></div>
        <motion.div 
          className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
        ></motion.div>
      </div>
      
      <div className="relative z-10 pt-24 pb-24 md:pb-32">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div variants={slideUp} className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Profile Settings</h1>
            <p className="text-white/70 mt-2">Manage your account information and preferences</p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-md shadow-lg backdrop-blur-sm ${
                  message.type === "success"
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <motion.div 
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              variants={cardVariants}
            >
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-6 text-white/90">Personal Information</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center space-y-4 mb-8">
                      <div className="relative group">
                        <div 
                          onClick={handleAvatarClick}
                          className="cursor-pointer group-hover:ring-2 ring-primary transition-all duration-300"
                        >
                          <Avatar 
                            src={avatarUrl} 
                            alt={`${firstName} ${lastName}`} 
                            size="lg" 
                          />
                        </div>
                        <div 
                          className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={handleAvatarClick}
                        >
                          <Camera className="text-primary" size={24} />
                        </div>
                        {avatarFile && (
                          <button 
                            type="button"
                            onClick={removeSelectedImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5 shadow-md"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="text-sm text-white/60">
                        Click to upload profile picture
                        {(loading && !uploading) && <span className="ml-2 text-primary animate-pulse">Processing...</span>} 
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-white/80">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full p-3 rounded-lg border border-white/10 bg-black/30 text-white focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-white/80">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full p-3 rounded-lg border border-white/10 bg-black/30 text-white focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2 text-white/80">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full p-3 rounded-lg border border-white/10 bg-black/50 text-white/60"
                      />
                      <p className="mt-2 text-sm text-white/60">
                        Contact support to change your email address
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={loading || uploading}
                        className="bg-gradient-to-r from-black/90 to-gray-900 hover:from-primary/70 hover:to-primary/90 text-white font-medium px-6 py-2.5 border border-primary/30 rounded-lg transition-all duration-300 shadow-md"
                      >
                        {uploading ? (
                          <div className="flex items-center">
                            <div className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin mr-2"></div>
                            Uploading...
                          </div>
                        ) : loading ? (
                           <div className="flex items-center">
                            <div className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin mr-2"></div>
                            Processing...
                          </div>
                        ) : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              variants={cardVariants}
            >
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-6 text-white/90">Security</h2>
                
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-gradient-to-r from-black/90 to-gray-900 border-white/20 hover:border-primary/40 text-white group py-3 px-4 rounded-lg transition-all duration-300"
                    onClick={() => router.push("/reset-password")}
                  >
                    <Lock className="h-4 w-4 mr-3 text-primary group-hover:scale-110 transition-transform duration-300" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Change Password</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-gradient-to-r from-black/90 to-gray-900 border-white/20 hover:border-red-500/40 text-white group py-3 px-4 rounded-lg transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4 mr-3 text-red-400 group-hover:scale-110 transition-transform duration-300" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Delete Account</span>
                  </Button>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              variants={cardVariants}
            >
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-2 text-white/90">My Bookings</h2>
                <p className="text-white/60 mb-6 text-sm">View and manage your bike rentals and booking history.</p>
                
                <Button 
                  variant="default" 
                  className="w-full md:w-auto bg-gradient-to-r from-black/90 to-gray-900 hover:from-primary/70 hover:to-primary/90 text-white font-medium px-6 py-2.5 border border-primary/30 rounded-lg transition-all duration-300 shadow-md group"
                  onClick={() => router.push("/dashboard/my-bookings")}
                >
                  <Calendar className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">View My Bookings</span>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 