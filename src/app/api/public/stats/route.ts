import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

// Cache stats for 5 minutes to avoid hammering the database
let cachedStats: { data: Stats; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface Stats {
  totalVideos: number;
  weeklyVideos: number;
  totalUsers: number;
}

export async function GET() {
  try {
    // Return cached data if still valid
    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedStats.data);
    }

    const supabase = getAdminClient();

    // Fetch stats in parallel
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [totalVideosResult, weeklyVideosResult, totalUsersResult] = await Promise.all([
      // Total completed videos
      supabase
        .from('generations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),

      // Videos created in the last 7 days
      supabase
        .from('generations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', oneWeekAgo.toISOString()),

      // Total users
      supabase
        .from('user_credits')
        .select('id', { count: 'exact', head: true }),
    ]);

    const stats: Stats = {
      totalVideos: totalVideosResult.count ?? 0,
      weeklyVideos: weeklyVideosResult.count ?? 0,
      totalUsers: totalUsersResult.count ?? 0,
    };

    // Cache the results
    cachedStats = { data: stats, timestamp: Date.now() };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching public stats:', error);

    // Return zeros on error
    return NextResponse.json({
      totalVideos: 0,
      weeklyVideos: 0,
      totalUsers: 0,
    });
  }
}
