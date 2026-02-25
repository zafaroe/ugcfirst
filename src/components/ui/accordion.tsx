'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export interface AccordionItem {
  id: string
  question: string
  answer: string
}

export interface AccordionProps {
  items: AccordionItem[]
  className?: string
  allowMultiple?: boolean
}

export function Accordion({ items, className, allowMultiple = false }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      )
    } else {
      setOpenItems(prev => (prev.includes(id) ? [] : [id]))
    }
  }

  const isOpen = (id: string) => openItems.includes(id)

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => (
        <AccordionItemComponent
          key={item.id}
          item={item}
          isOpen={isOpen(item.id)}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </div>
  )
}

interface AccordionItemComponentProps {
  item: AccordionItem
  isOpen: boolean
  onToggle: () => void
}

function AccordionItemComponent({ item, isOpen, onToggle }: AccordionItemComponentProps) {
  return (
    <div className={cn(
      "rounded-xl bg-surface border overflow-hidden transition-all duration-300",
      isOpen
        ? "border-l-2 border-l-mint border-t-border-default border-r-border-default border-b-border-default bg-mint/5"
        : "border-border-default"
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <span className={cn(
          "font-medium pr-4 transition-colors",
          isOpen ? "text-text-primary" : "text-text-primary"
        )}>{item.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className={cn(
            "w-5 h-5 transition-colors",
            isOpen ? "text-mint" : "text-text-muted"
          )} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-4 text-text-muted leading-relaxed">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Simple FAQ component that wraps Accordion with a title
export interface FAQProps {
  title?: string
  items: AccordionItem[]
  className?: string
}

export function FAQ({ title = 'Frequently Asked Questions', items, className }: FAQProps) {
  return (
    <div className={className}>
      <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-8">
        {title}
      </h2>
      <Accordion items={items} />
    </div>
  )
}
