import type { Avatar } from '@/types'

export const mockAvatars: Avatar[] = [
  {
    id: 'avatar_1',
    name: 'Sarah',
    image: '/images/avatars/sarah.svg',
    videoPreview: '/videos/avatars/sarah-preview.mp4',
    style: 'energetic',
    gender: 'female',
    isPremium: false,
    voiceSample: '/audio/sarah-sample.mp3',
  },
  {
    id: 'avatar_2',
    name: 'Michael',
    image: '/images/avatars/michael.svg',
    videoPreview: '/videos/avatars/michael-preview.mp4',
    style: 'professional',
    gender: 'male',
    isPremium: false,
    voiceSample: '/audio/michael-sample.mp3',
  },
  {
    id: 'avatar_3',
    name: 'Emma',
    image: '/images/avatars/emma.svg',
    videoPreview: '/videos/avatars/emma-preview.mp4',
    style: 'casual',
    gender: 'female',
    isPremium: false,
    voiceSample: '/audio/emma-sample.mp3',
  },
  {
    id: 'avatar_4',
    name: 'James',
    image: '/images/avatars/james.svg',
    videoPreview: '/videos/avatars/james-preview.mp4',
    style: 'energetic',
    gender: 'male',
    isPremium: true,
    voiceSample: '/audio/james-sample.mp3',
  },
  {
    id: 'avatar_5',
    name: 'Sophia',
    image: '/images/avatars/sophia.svg',
    videoPreview: '/videos/avatars/sophia-preview.mp4',
    style: 'professional',
    gender: 'female',
    isPremium: true,
    voiceSample: '/audio/sophia-sample.mp3',
  },
  {
    id: 'avatar_6',
    name: 'Alex',
    image: '/images/avatars/alex.svg',
    videoPreview: '/videos/avatars/alex-preview.mp4',
    style: 'casual',
    gender: 'neutral',
    isPremium: false,
    voiceSample: '/audio/alex-sample.mp3',
  },
  {
    id: 'avatar_7',
    name: 'Isabella',
    image: '/images/avatars/isabella.svg',
    videoPreview: '/videos/avatars/isabella-preview.mp4',
    style: 'energetic',
    gender: 'female',
    isPremium: true,
    voiceSample: '/audio/isabella-sample.mp3',
  },
  {
    id: 'avatar_8',
    name: 'David',
    image: '/images/avatars/david.svg',
    videoPreview: '/videos/avatars/david-preview.mp4',
    style: 'professional',
    gender: 'male',
    isPremium: false,
    voiceSample: '/audio/david-sample.mp3',
  },
]

export function getAvatarById(id: string): Avatar | undefined {
  return mockAvatars.find((a) => a.id === id)
}

export function getAvatarsByGender(gender: Avatar['gender']): Avatar[] {
  return mockAvatars.filter((a) => a.gender === gender)
}

export function getAvatarsByStyle(style: Avatar['style']): Avatar[] {
  return mockAvatars.filter((a) => a.style === style)
}

export function getFreeAvatars(): Avatar[] {
  return mockAvatars.filter((a) => !a.isPremium)
}

export function getPremiumAvatars(): Avatar[] {
  return mockAvatars.filter((a) => a.isPremium)
}
