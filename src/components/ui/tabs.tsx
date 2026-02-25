'use client'

import { createContext, useContext, useState, useId } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DURATIONS, EASINGS } from './motion'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
  layoutId: string
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
  onChange?: (value: string) => void
}

export function Tabs({ defaultValue, children, className, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  const layoutId = useId()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onChange?.(value)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange, layoutId }}>
      <LayoutGroup>
        <div className={className}>{children}</div>
      </LayoutGroup>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn('flex border-b border-border-default', className)}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { activeTab, setActiveTab, layoutId } = useTabs()
  const isActive = activeTab === value

  return (
    <button
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={cn(
        'px-4 py-3 text-sm font-medium transition-colors relative',
        isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-primary',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId={`tab-indicator-${layoutId}`}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mint-light to-mint-dark"
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 35,
          }}
        />
      )}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

// Animation variants for tab content
const contentVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.easeIn,
    },
  },
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabs()

  return (
    <AnimatePresence mode="wait">
      {activeTab === value && (
        <motion.div
          key={value}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn('pt-4', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
