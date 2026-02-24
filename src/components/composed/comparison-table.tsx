'use client'

import { Check, X, Minus, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface ComparisonRow {
  feature: string
  vidnary: string
  diy: string
  freelancer: string
  agency: string
}

export interface CompetitorComparisonRow {
  feature: string
  vidnary: string
  makeugc: string
  creatify: string
  vidnaryWins?: boolean
}

export interface ComparisonTableProps {
  data: ComparisonRow[]
  className?: string
}

export interface CompetitorComparisonTableProps {
  data: CompetitorComparisonRow[]
  className?: string
}

const columns = [
  { key: 'vidnary', label: 'Vidnary', highlight: true },
  { key: 'diy', label: 'DIY' },
  { key: 'freelancer', label: 'Freelancer' },
  { key: 'agency', label: 'Agency' },
]

const competitorColumns = [
  { key: 'vidnary', label: 'Vidnary', highlight: true },
  { key: 'makeugc', label: 'MakeUGC' },
  { key: 'creatify', label: 'Creatify' },
]

function getCellIcon(value: string) {
  if (value.toLowerCase() === 'yes') {
    return <Check className="w-5 h-5 text-status-success mx-auto" />
  }
  if (value.toLowerCase() === 'no') {
    return <X className="w-5 h-5 text-status-error mx-auto" />
  }
  return null
}

export function ComparisonTable({ data, className }: ComparisonTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            <th className="text-left py-4 px-4 text-text-muted font-medium text-sm">
              Feature
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'py-4 px-4 text-center font-semibold text-sm',
                  col.highlight
                    ? 'text-electric-indigo bg-electric-indigo/10 rounded-t-xl'
                    : 'text-text-muted'
                )}
              >
                {col.highlight && (
                  <span className="block text-xs font-normal text-electric-indigo mb-1">
                    Recommended
                  </span>
                )}
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <motion.tr
              key={row.feature}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border-t border-border-default"
            >
              <td className="py-4 px-4 text-text-primary font-medium text-sm">
                {row.feature}
              </td>
              {columns.map((col) => {
                const value = row[col.key as keyof ComparisonRow]
                const icon = getCellIcon(value)
                return (
                  <td
                    key={col.key}
                    className={cn(
                      'py-4 px-4 text-center text-sm',
                      col.highlight
                        ? 'bg-electric-indigo/10 text-text-primary font-medium'
                        : 'text-text-muted'
                    )}
                  >
                    {icon || value}
                  </td>
                )
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Competitor Comparison Table - Vidnary vs MakeUGC vs Creatify
export function CompetitorComparisonTable({ data, className }: CompetitorComparisonTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[500px]">
        <thead>
          <tr>
            <th className="text-left py-4 px-4 text-text-muted font-medium text-sm w-1/4">
              Feature
            </th>
            {competitorColumns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'py-4 px-4 text-center font-semibold text-sm w-1/4',
                  col.highlight
                    ? 'text-white bg-gradient-to-b from-electric-indigo to-vibrant-fuchsia rounded-t-xl'
                    : 'text-text-muted bg-surface/50'
                )}
              >
                {col.highlight && (
                  <span className="flex items-center justify-center gap-1 text-xs font-normal text-white/80 mb-1">
                    <Crown className="w-3 h-3" />
                    Best Choice
                  </span>
                )}
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <motion.tr
              key={row.feature}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'border-t border-border-default',
                row.vidnaryWins && 'bg-electric-indigo/5'
              )}
            >
              <td className="py-4 px-4 text-text-primary font-medium text-sm">
                {row.feature}
              </td>
              {competitorColumns.map((col) => {
                const value = row[col.key as keyof CompetitorComparisonRow] as string
                const icon = getCellIcon(value)
                const isVidnary = col.key === 'vidnary'
                const isWinningRow = row.vidnaryWins && isVidnary

                return (
                  <td
                    key={col.key}
                    className={cn(
                      'py-4 px-4 text-center text-sm',
                      isVidnary
                        ? 'bg-electric-indigo/10 text-text-primary font-semibold'
                        : 'text-text-muted',
                      isWinningRow && 'text-status-success'
                    )}
                  >
                    <span className={cn(
                      'inline-flex items-center gap-1',
                      isWinningRow && 'text-status-success font-bold'
                    )}>
                      {icon || value}
                      {isWinningRow && <Check className="w-4 h-4 text-status-success" />}
                    </span>
                  </td>
                )
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-text-muted text-center mt-4">
        Pricing data sourced from official websites as of January 2026. Subject to change.
      </p>
    </div>
  )
}
