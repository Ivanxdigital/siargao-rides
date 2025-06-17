"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Users,
  Shield,
  Camera,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  Plus,
  Upload,
  Settings,
  Target,
  Award,
  Zap
} from "lucide-react";

interface SetupTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  href?: string;
  action?: string;
  points: number;
  priority: 'high' | 'medium' | 'low';
  benefit?: string;
}

interface ProgressiveSetupCardProps {
  shopId?: string;
  vehicleCount: number;
  shopData?: {
    logo_url?: string;
    banner_url?: string;
    description?: string;
    location_area?: string;
    phone_number?: string;
    is_verified?: boolean;
  };
  className?: string;
}

export function ProgressiveSetupCard({
  shopId,
  vehicleCount,
  shopData,
  className = ""
}: ProgressiveSetupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate setup tasks with gamification
  const setupTasks: SetupTask[] = [
    {
      id: "add_vehicles",
      title: "Add Your First Vehicle",
      description: "Start earning by listing your vehicles",
      completed: vehicleCount > 0,
      icon: <Plus className="h-5 w-5" />,
      href: "/dashboard/vehicles/add",
      action: "Add Vehicle",
      points: 50,
      priority: 'high',
      benefit: "Start receiving bookings"
    },
    {
      id: "upload_logo",
      title: "Add Shop Logo",
      description: "Make your shop look professional",
      completed: !!shopData?.logo_url,
      icon: <Camera className="h-5 w-5" />,
      href: "/dashboard/shop/settings",
      action: "Upload Logo",
      points: 25,
      priority: 'medium',
      benefit: "40% more customer trust"
    },
    {
      id: "upload_banner",
      title: "Add Shop Banner",
      description: "Showcase your shop with a great banner",
      completed: !!shopData?.banner_url,
      icon: <Upload className="h-5 w-5" />,
      href: "/dashboard/shop/settings",
      action: "Upload Banner",
      points: 25,
      priority: 'medium',
      benefit: "Better visual appeal"
    },
    {
      id: "complete_description",
      title: "Improve Description",
      description: "Tell customers about your services",
      completed: !!(shopData?.description && shopData.description.length > 50),
      icon: <FileText className="h-5 w-5" />,
      href: "/dashboard/shop/settings",
      action: "Edit Description",
      points: 20,
      priority: 'medium',
      benefit: "Better search visibility"
    },
    {
      id: "verify_phone",
      title: "Verify Phone Number",
      description: "Let customers contact you easily",
      completed: !!shopData?.phone_number,
      icon: <Phone className="h-5 w-5" />,
      href: "/dashboard/shop/settings",
      action: "Add Phone",
      points: 15,
      priority: 'high',
      benefit: "Direct customer contact"
    },
    {
      id: "get_verified",
      title: "Get Verified Badge",
      description: "Upload documents to get verified",
      completed: !!shopData?.is_verified,
      icon: <Shield className="h-5 w-5" />,
      href: "/dashboard/shop/verification",
      action: "Get Verified",
      points: 100,
      priority: 'high',
      benefit: "60% more bookings"
    }
  ];

  const completedTasks = setupTasks.filter(task => task.completed);
  const pendingTasks = setupTasks.filter(task => !task.completed);
  const totalPoints = setupTasks.reduce((sum, task) => sum + task.points, 0);
  const earnedPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);
  const completionPercentage = Math.round((earnedPoints / totalPoints) * 100);

  // Determine level based on completion
  const getLevel = (percentage: number) => {
    if (percentage >= 90) return { name: "Expert", icon: "🏆", color: "text-yellow-400" };
    if (percentage >= 70) return { name: "Pro", icon: "⭐", color: "text-orange-400" };
    if (percentage >= 50) return { name: "Advanced", icon: "🚀", color: "text-teal-400" };
    if (percentage >= 25) return { name: "Getting Started", icon: "📈", color: "text-green-400" };
    return { name: "Beginner", icon: "🌱", color: "text-gray-400" };
  };

  const currentLevel = getLevel(completionPercentage);

  // Show next 2-3 most important pending tasks
  const nextTasks = pendingTasks
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 3);

  if (completionPercentage >= 90) {
    return null; // Hide when almost complete
  }

  return (
    <motion.div
      className={`bg-gradient-to-br from-teal-900/90 to-orange-900/90 rounded-xl border border-teal-700/30 shadow-lg overflow-hidden backdrop-blur-md ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Setup Progress
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-sm font-medium ${currentLevel.color}`}>
                  {currentLevel.icon} {currentLevel.name}
                </span>
                <span className="text-white/60 text-sm">
                  {earnedPoints}/{totalPoints} points
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {completionPercentage}%
              </div>
              <div className="text-white/60 text-xs">Complete</div>
            </div>
            <button className="text-white/80 hover:text-white transition-colors">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <Progress 
            value={completionPercentage} 
            className="h-2 bg-white/20"
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6"
          >
            {/* Achievement Banner */}
            {completedTasks.length > 0 && (
              <div className="bg-green-900/30 border border-green-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-5 w-5 text-green-400" />
                  <span className="text-green-300 font-medium">
                    Nice work! {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {completedTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-1 bg-green-800/30 px-2 py-1 rounded text-green-200 text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{task.title}</span>
                      <span className="text-green-300 font-medium">+{task.points}</span>
                    </div>
                  ))}
                  {completedTasks.length > 3 && (
                    <div className="text-green-300 text-xs py-1">
                      +{completedTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Tasks */}
            {nextTasks.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                  Quick Wins
                </h4>
                <div className="space-y-3">
                  {nextTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {task.icon}
                          </div>
                          <div className="flex-1">
                            <h5 className="text-white font-medium">{task.title}</h5>
                            <p className="text-white/60 text-sm mt-1">{task.description}</p>
                            {task.benefit && (
                              <div className="flex items-center mt-2 text-green-400 text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {task.benefit}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-white/60 text-xs">Earn</div>
                            <div className="text-yellow-400 font-bold">+{task.points}</div>
                          </div>
                          {task.href && (
                            <Link href={task.href}>
                              <Button
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700 text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
                              >
                                {task.action}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion celebration */}
            {completionPercentage >= 70 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-teal-900/50 to-orange-900/50 border border-teal-700/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-medium">
                    Almost there! Your shop is looking great 🎉
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}