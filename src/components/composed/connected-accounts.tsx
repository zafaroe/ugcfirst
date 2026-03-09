'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  FaTiktok,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaLinkedin,
  FaFacebook,
} from 'react-icons/fa';
import { SiThreads, SiPinterest, SiReddit, SiBluesky } from 'react-icons/si';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { GlassCard, EASINGS } from '@/components/ui';
import { getBrowserClient } from '@/lib/supabase';
import { hasSchedulingAccess } from '@/config/pricing';
import { ScheduleUpgradeCard } from './schedule-upgrade-card';
import type { LatePlatform } from '@/lib/social/late';
import type { ConnectedAccount } from '@/types/connected-account';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ============================================
// PLATFORM CONFIG
// ============================================

interface PlatformConfig {
  id: LatePlatform;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const PLATFORMS: PlatformConfig[] = [
  { id: 'tiktok', name: 'TikTok', icon: FaTiktok, color: 'text-white', bgColor: 'bg-black' },
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'text-white', bgColor: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: 'text-white', bgColor: 'bg-red-600' },
  { id: 'twitter', name: 'Twitter/X', icon: FaTwitter, color: 'text-white', bgColor: 'bg-black' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'text-white', bgColor: 'bg-blue-700' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'text-white', bgColor: 'bg-blue-600' },
  { id: 'threads', name: 'Threads', icon: SiThreads, color: 'text-white', bgColor: 'bg-black' },
  { id: 'pinterest', name: 'Pinterest', icon: SiPinterest, color: 'text-white', bgColor: 'bg-red-500' },
  { id: 'reddit', name: 'Reddit', icon: SiReddit, color: 'text-white', bgColor: 'bg-orange-600' },
  { id: 'bluesky', name: 'Bluesky', icon: SiBluesky, color: 'text-white', bgColor: 'bg-sky-500' },
];

// ============================================
// COMPONENT
// ============================================

export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<LatePlatform | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [userTier, setUserTier] = useState<string>('free');

  // Fetch connected accounts and user tier on mount
  useEffect(() => {
    fetchAccountsAndTier();

    // Check for success/error from OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const successMsg = params.get('success');
    const errorMsg = params.get('error');

    if (successMsg) {
      setSuccess(successMsg);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setSuccess(null), 5000);
    }
    if (errorMsg) {
      setError(errorMsg);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const fetchAccountsAndTier = async () => {
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      // Fetch accounts and credits (for tier) in parallel
      const [accountsRes, creditsRes] = await Promise.all([
        fetch('/api/social/accounts', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch('/api/credits/balance', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      const accountsData = await accountsRes.json();
      if (accountsData.success) {
        setAccounts(accountsData.accounts);
      }

      const creditsData = await creditsRes.json();
      if (creditsData.success) {
        setUserTier(creditsData.data?.tier || 'free');
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (platform: LatePlatform) => {
    setConnectingPlatform(platform);
    setError(null);
    setRequiresUpgrade(false);

    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Please log in to connect accounts');
        return;
      }

      const response = await fetch(`/api/social/connect?platform=${platform}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        if (data.requiresUpgrade) {
          setRequiresUpgrade(true);
        }
        setError(data.error || 'Failed to start connection');
        return;
      }

      // Redirect to OAuth URL
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('Connect error:', err);
      setError('Failed to connect. Please try again.');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    setDisconnectingId(accountId);
    setError(null);

    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(`/api/social/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
        setSuccess('Account disconnected');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      console.error('Disconnect error:', err);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setDisconnectingId(null);
    }
  };

  // Get connected platforms
  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  // Check if user has scheduling access
  const hasAccess = hasSchedulingAccess(userTier);

  // Show upgrade card for non-Pro users (after loading)
  if (!isLoading && !hasAccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: EASINGS.easeOut }}
      >
        <ScheduleUpgradeCard variant="full" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4, ease: EASINGS.easeOut }}
    >
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Connect your social media accounts to schedule posts directly from UGCFirst
            </CardDescription>
          </div>
        </div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-lg bg-status-success/10 border border-status-success/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
              <p className="text-sm text-status-success">{success}</p>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "mb-4 p-3 rounded-lg flex items-start gap-3",
                requiresUpgrade
                  ? "bg-amber-500/10 border border-amber-500/20"
                  : "bg-status-error/10 border border-status-error/20"
              )}
            >
              <AlertCircle className={cn(
                "w-5 h-5 flex-shrink-0 mt-0.5",
                requiresUpgrade ? "text-amber-500" : "text-status-error"
              )} />
              <div className="flex-1">
                <p className={cn(
                  "text-sm",
                  requiresUpgrade ? "text-amber-600" : "text-status-error"
                )}>{error}</p>
                {requiresUpgrade && (
                  <Link href="/settings/billing" className="inline-block mt-2">
                    <Button variant="secondary" size="sm">
                      Upgrade to Pro
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-mint" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected Accounts */}
            {accounts.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-primary">Connected</p>
                {accounts.map((account) => {
                  const platform = PLATFORMS.find((p) => p.id === account.platform);
                  if (!platform) return null;
                  const Icon = platform.icon;

                  return (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-raised border border-border-default"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', platform.bgColor)}>
                          <Icon className={cn('w-5 h-5', platform.color)} />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{platform.name}</p>
                          <p className="text-sm text-text-muted">
                            {account.accountName || 'Connected'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={disconnectingId === account.id}
                        className="text-text-muted hover:text-status-error"
                      >
                        {disconnectingId === account.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Available to Connect */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-text-primary">
                {accounts.length > 0 ? 'Add More' : 'Available Platforms'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PLATFORMS.filter((p) => !connectedPlatforms.has(p.id)).map((platform) => {
                  const Icon = platform.icon;
                  const isConnecting = connectingPlatform === platform.id;

                  return (
                    <motion.button
                      key={platform.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border border-border-default',
                        'hover:border-mint/50 hover:bg-surface-raised transition-all',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', platform.bgColor)}>
                        <Icon className={cn('w-4 h-4', platform.color)} />
                      </div>
                      <span className="text-sm font-medium text-text-primary flex-1 text-left">
                        {platform.name}
                      </span>
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-mint" />
                      ) : (
                        <Plus className="w-4 h-4 text-text-muted" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Help Text */}
            <p className="text-xs text-text-muted pt-2">
              Connected accounts allow you to schedule and publish videos directly to your social media profiles.
            </p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
