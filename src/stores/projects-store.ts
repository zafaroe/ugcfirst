import { create } from 'zustand'
import type { Project, ProjectStatus } from '@/types'
import { mockProjects } from '@/mocks/data'
import { delay, generateId } from '@/lib/utils'

interface ProjectsState {
  // State
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchProjects: () => Promise<void>
  fetchProjectById: (id: string) => Promise<void>
  createProject: (data: Partial<Project>) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  duplicateProject: (id: string) => Promise<Project>
  setCurrentProject: (project: Project | null) => void

  // Filters
  getProjectsByStatus: (status: ProjectStatus) => Project[]
  getRecentProjects: (limit?: number) => Project[]
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Fetch all projects
  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      await delay(500)
      set({ projects: mockProjects, isLoading: false })
    } catch {
      set({ error: 'Failed to fetch projects', isLoading: false })
    }
  },

  // Fetch single project
  fetchProjectById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await delay(300)
      const project = mockProjects.find(p => p.id === id)
      if (project) {
        set({ currentProject: project, isLoading: false })
      } else {
        set({ error: 'Project not found', isLoading: false })
      }
    } catch {
      set({ error: 'Failed to fetch project', isLoading: false })
    }
  },

  // Create new project
  createProject: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await delay(500)
      const newProject: Project = {
        id: generateId('proj'),
        title: data.title || 'Untitled Project',
        status: 'queued',
        duration: data.duration || 30,
        creditCost: data.creditCost || 10,
        mode: data.mode || 'diy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      }

      set(state => ({
        projects: [newProject, ...state.projects],
        currentProject: newProject,
        isLoading: false,
      }))

      return newProject
    } catch {
      set({ error: 'Failed to create project', isLoading: false })
      throw new Error('Failed to create project')
    }
  },

  // Update project
  updateProject: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await delay(300)
      set(state => ({
        projects: state.projects.map(p =>
          p.id === id
            ? { ...p, ...data, updatedAt: new Date().toISOString() }
            : p
        ),
        currentProject:
          state.currentProject?.id === id
            ? { ...state.currentProject, ...data, updatedAt: new Date().toISOString() }
            : state.currentProject,
        isLoading: false,
      }))
    } catch {
      set({ error: 'Failed to update project', isLoading: false })
    }
  },

  // Delete project
  deleteProject: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await delay(300)
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject:
          state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }))
    } catch {
      set({ error: 'Failed to delete project', isLoading: false })
    }
  },

  // Duplicate project
  duplicateProject: async (id) => {
    const project = get().projects.find(p => p.id === id)
    if (!project) {
      throw new Error('Project not found')
    }

    return get().createProject({
      ...project,
      id: undefined,
      title: `${project.title} (Copy)`,
      status: 'queued',
      videoUrl: undefined,
    })
  },

  // Set current project
  setCurrentProject: (project) => {
    set({ currentProject: project })
  },

  // Get projects by status
  getProjectsByStatus: (status) => {
    return get().projects.filter(p => p.status === status)
  },

  // Get recent projects
  getRecentProjects: (limit = 4) => {
    return [...get().projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  },
}))
