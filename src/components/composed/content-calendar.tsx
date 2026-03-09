'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SPRING } from '@/components/ui/motion';
import type { ScheduledPost, ScheduleStatus } from '@/types/schedule';
import { ScheduledPostCard } from './scheduled-post-card';

// ============================================
// TYPES
// ============================================

export interface ContentCalendarProps {
  posts: ScheduledPost[];
  onPostClick?: (post: ScheduledPost) => void;
  onCancel?: (post: ScheduledPost) => void;
  onRetry?: (post: ScheduledPost) => void;
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusDotColors: Record<ScheduleStatus, string> = {
  pending: 'bg-mint',
  scheduled: 'bg-blue-500',
  processing: 'bg-amber-500',
  published: 'bg-status-success',
  failed: 'bg-status-error',
  cancelled: 'bg-gray-500',
};

// ============================================
// HELPERS
// ============================================

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ============================================
// CONTENT CALENDAR COMPONENT
// ============================================

export function ContentCalendar({
  posts,
  onPostClick,
  onCancel,
  onRetry,
  className,
}: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const days: (Date | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Pad to complete the last week
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [year, month]);

  // Map posts to dates
  const postsByDate = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();

    posts.forEach((post) => {
      // Use scheduledFor if available, otherwise use createdAt
      const dateStr = post.scheduledFor || post.createdAt;
      const date = new Date(dateStr);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(post);
    });

    return map;
  }, [posts]);

  const getPostsForDate = (date: Date): ScheduledPost[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return postsByDate.get(key) || [];
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Selected date posts
  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Calendar Card */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h3 className="text-lg font-semibold text-text-primary">{monthName}</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-border-default">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-text-muted uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[80px] border-b border-r border-border-default bg-surface-raised/30"
                />
              );
            }

            const dayPosts = getPostsForDate(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            const isCurrentMonth = date.getMonth() === month;

            return (
              <motion.button
                key={date.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                transition={SPRING.gentle}
                className={cn(
                  'min-h-[80px] p-2 border-b border-r border-border-default text-left transition-colors relative',
                  isSelected && 'bg-mint/10 ring-2 ring-mint ring-inset',
                  !isSelected && isTodayDate && 'bg-mint/5',
                  !isCurrentMonth && 'opacity-50'
                )}
              >
                {/* Day number */}
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium',
                    isTodayDate && 'bg-mint text-white',
                    !isTodayDate && 'text-text-primary'
                  )}
                >
                  {date.getDate()}
                </span>

                {/* Post dots */}
                {dayPosts.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayPosts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className={cn(
                          'w-2 h-2 rounded-full',
                          statusDotColors[post.status]
                        )}
                        title={post.caption?.slice(0, 50) || 'No caption'}
                      />
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-xs text-text-muted font-medium">
                        +{dayPosts.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 px-4">
        {[
          { status: 'pending', label: 'Pending' },
          { status: 'scheduled', label: 'Scheduled' },
          { status: 'published', label: 'Published' },
          { status: 'failed', label: 'Failed' },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', statusDotColors[status as ScheduleStatus])} />
            <span className="text-xs text-text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected Date Posts */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-text-primary mb-4">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h4>

              {selectedDatePosts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-text-muted text-sm">No posts scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDatePosts.map((post) => (
                    <ScheduledPostCard
                      key={post.id}
                      post={post}
                      onClick={onPostClick}
                      onCancel={onCancel}
                      onRetry={onRetry}
                    />
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
