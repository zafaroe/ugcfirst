'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
} from 'lucide-react';
import {
  FaTiktok,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaLinkedin,
  FaFacebook,
} from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getBrowserClient } from '@/lib/supabase';
import type { LatePlatform } from '@/lib/social/late';
import type { ConnectedAccount } from '@/types/connected-account';

// ============================================
// TYPES
// ============================================

export interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  defaultCaption?: string;
  generationId?: string;
  onScheduled?: (scheduledPostId: string) => void;
}

interface PlatformOption {
  id: LatePlatform;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// ============================================
// PLATFORM OPTIONS
// ============================================

const PLATFORMS: PlatformOption[] = [
  { id: 'tiktok', name: 'TikTok', icon: FaTiktok, color: 'bg-black' },
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: 'bg-red-600' },
  { id: 'twitter', name: 'Twitter/X', icon: FaTwitter, color: 'bg-sky-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'bg-blue-700' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'bg-blue-600' },
];

// ============================================
// SCHEDULE MODAL COMPONENT
// ============================================

export function ScheduleModal({
  isOpen,
  onClose,
  videoUrl,
  defaultCaption = '',
  generationId,
  onScheduled,
}: ScheduleModalProps) {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<LatePlatform[]>([]);
  const [caption, setCaption] = useState(defaultCaption);
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch connected accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchConnectedAccounts();
    }
  }, [isOpen]);

  const fetchConnectedAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setIsLoadingAccounts(false);
        return;
      }

      const response = await fetch('/api/social/accounts', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setConnectedAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Failed to fetch connected accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Get connected platform IDs
  const connectedPlatformIds = new Set(connectedAccounts.map((a) => a.platform));

  // Filter platforms to only show connected ones
  const availablePlatforms = PLATFORMS.filter((p) => connectedPlatformIds.has(p.id));

  const togglePlatform = (platform: LatePlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async () => {
    setError(null);

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    if (scheduleType === 'later' && (!scheduledDate || !scheduledTime)) {
      setError('Please select a date and time for scheduling');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get auth token
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Please log in to schedule posts');
        return;
      }

      // Build scheduled time if scheduling for later
      let scheduledFor: string | undefined;
      if (scheduleType === 'later') {
        scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      // Call schedule API
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          generationId,
          videoUrl,
          caption,
          platforms: selectedPlatforms,
          scheduledFor,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to schedule post');
        return;
      }

      setSuccess(true);
      onScheduled?.(data.scheduledPost.id);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        // Reset state
        setSuccess(false);
        setSelectedPlatforms([]);
        setCaption(defaultCaption);
        setScheduleType('now');
        setScheduledDate('');
        setScheduledTime('');
      }, 2000);
    } catch (err) {
      console.error('Schedule error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50"
          >
            <Card className="p-6 bg-surface border border-border-default shadow-2xl max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-mint to-mint-dark flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">
                      Schedule Post
                    </h2>
                    <p className="text-sm text-text-muted">
                      Share your video to social media
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-raised transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-status-success/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-status-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {scheduleType === 'now' ? 'Post Queued!' : 'Post Scheduled!'}
                  </h3>
                  <p className="text-text-muted">
                    {scheduleType === 'now'
                      ? 'Your video will be posted shortly'
                      : 'Your video will be posted at the scheduled time'}
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Platform Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Select Platforms
                    </label>

                    {isLoadingAccounts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-mint" />
                      </div>
                    ) : availablePlatforms.length === 0 ? (
                      <div className="p-6 rounded-xl border-2 border-dashed border-border-default text-center">
                        <Settings className="w-10 h-10 text-text-muted mx-auto mb-3" />
                        <p className="text-text-primary font-medium mb-2">
                          No accounts connected
                        </p>
                        <p className="text-sm text-text-muted mb-4">
                          Connect your social media accounts to schedule posts
                        </p>
                        <Link href="/settings">
                          <Button variant="secondary" size="sm">
                            Go to Settings
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {availablePlatforms.map((platform) => {
                          const isSelected = selectedPlatforms.includes(platform.id);
                          const Icon = platform.icon;
                          const account = connectedAccounts.find((a) => a.platform === platform.id);
                          return (
                            <button
                              key={platform.id}
                              onClick={() => togglePlatform(platform.id)}
                              className={cn(
                                'p-3 rounded-xl border-2 transition-all',
                                isSelected
                                  ? 'border-mint bg-mint/10'
                                  : 'border-border-default hover:border-mint/50'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2',
                                  platform.color
                                )}
                              >
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <p className="text-sm text-text-primary font-medium">
                                {platform.name}
                              </p>
                              {account?.accountName && (
                                <p className="text-xs text-text-muted truncate mt-0.5">
                                  {account.accountName}
                                </p>
                              )}
                              {isSelected && (
                                <Badge variant="purple" size="sm" className="mt-1">
                                  Selected
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div className="mb-6">
                    <Textarea
                      label="Caption"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write your caption..."
                      maxLength={2200}
                      showCount
                      helperText="Include hashtags for better reach"
                    />
                  </div>

                  {/* Schedule Type */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      When to Post
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setScheduleType('now')}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all text-left',
                          scheduleType === 'now'
                            ? 'border-mint bg-mint/10'
                            : 'border-border-default hover:border-mint/50'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-mint" />
                          <span className="font-medium text-text-primary">
                            Post Now
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">
                          Publish immediately
                        </p>
                      </button>
                      <button
                        onClick={() => setScheduleType('later')}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all text-left',
                          scheduleType === 'later'
                            ? 'border-mint bg-mint/10'
                            : 'border-border-default hover:border-mint/50'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-mint" />
                          <span className="font-medium text-text-primary">
                            Schedule
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">
                          Pick a date & time
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Date/Time Picker (if scheduling) */}
                  {scheduleType === 'later' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Date
                          </label>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={today}
                            className="w-full px-4 py-2.5 bg-cream border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-mint/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Time
                          </label>
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full px-4 py-2.5 bg-cream border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-mint/50"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-3 rounded-lg bg-status-error/10 border border-status-error/20 flex items-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
                      <p className="text-sm text-status-error">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedPlatforms.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {scheduleType === 'now' ? 'Posting...' : 'Scheduling...'}
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5 mr-2" />
                        {scheduleType === 'now'
                          ? `Post to ${selectedPlatforms.length} Platform${selectedPlatforms.length !== 1 ? 's' : ''}`
                          : `Schedule for ${selectedPlatforms.length} Platform${selectedPlatforms.length !== 1 ? 's' : ''}`}
                      </>
                    )}
                  </Button>
                </>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
