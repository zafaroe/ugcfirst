import type { Project } from '@/types'

export const mockProjects: Project[] = [
  {
    id: 'proj_1',
    title: 'Nike Air Max Promo',
    thumbnail: '/images/projects/nike-thumb.svg',
    status: 'ready',
    duration: 30,
    creditCost: 10,
    mode: 'diy',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    videoUrl: '/videos/nike-promo.mp4',
    script: 'Are you tired of uncomfortable shoes? The Nike Air Max is here to change the game. With visible Air cushioning and premium materials, every step feels like walking on clouds. Available now - link in bio!',
    avatarId: 'avatar_1',
    productId: 'prod_1',
  },
  {
    id: 'proj_2',
    title: 'Smart Watch Feature',
    thumbnail: '/images/projects/watch-thumb.svg',
    status: 'processing',
    duration: 15,
    creditCost: 15,
    mode: 'auto-pilot',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj_3',
    title: 'Headphones Unboxing',
    thumbnail: '/images/projects/headphones-thumb.svg',
    status: 'ready',
    duration: 30,
    creditCost: 10,
    mode: 'diy',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    videoUrl: '/videos/headphones.mp4',
    script: 'Just got these wireless headphones and WOW. Active noise cancellation? Check. 30-hour battery? Check. Premium sound quality? Double check. Best purchase I\'ve made this year!',
    avatarId: 'avatar_2',
    productId: 'prod_3',
  },
  {
    id: 'proj_4',
    title: 'Cosmetics Bundle',
    thumbnail: undefined,
    status: 'failed',
    duration: 30,
    creditCost: 10,
    mode: 'diy',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj_5',
    title: 'Fitness Tracker Ad',
    thumbnail: '/images/projects/fitness-thumb.svg',
    status: 'queued',
    duration: 15,
    creditCost: 10,
    mode: 'diy',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    script: 'Track your fitness journey with this amazing smart band. Heart rate, steps, sleep - it monitors everything!',
    avatarId: 'avatar_3',
    productId: 'prod_5',
  },
  {
    id: 'proj_6',
    title: 'Phone Mount Review',
    thumbnail: '/images/projects/phone-mount-thumb.svg',
    status: 'ready',
    duration: 20,
    creditCost: 10,
    mode: 'diy',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    videoUrl: '/videos/phone-mount.mp4',
    script: 'This phone mount changed my driving experience. One-hand operation, 360-degree rotation, and it holds my phone so securely!',
    avatarId: 'avatar_1',
    productId: 'prod_4',
  },
]

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id)
}

export function getProjectsByStatus(status: Project['status']): Project[] {
  return mockProjects.filter((p) => p.status === status)
}

export function getProjectsByMode(mode: Project['mode']): Project[] {
  return mockProjects.filter((p) => p.mode === mode)
}

export function getRecentProjects(limit: number = 4): Project[] {
  return [...mockProjects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}
