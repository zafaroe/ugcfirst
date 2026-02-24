'use client';

import { motion } from 'framer-motion';
import {
  Lightbulb,
  Package,
  Star,
  Clock,
  TrendingUp,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoTemplate } from '@/types/templates';
import { getAllTemplates } from '@/data/templates';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================
// ICON MAPPING
// ============================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  Package,
  Star,
};

// ============================================
// RATING STARS COMPONENT
// ============================================

function ConversionRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'w-3 h-3',
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-none text-gray-600'
          )}
        />
      ))}
    </div>
  );
}

// ============================================
// TEMPLATE CARD COMPONENT
// ============================================

interface TemplateCardProps {
  template: VideoTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const Icon = iconMap[template.icon] || Lightbulb;

  return (
    <Card
      hoverable
      selected={isSelected}
      className={cn(
        'cursor-pointer transition-all duration-200 p-5',
        isSelected && 'bg-electric-indigo/5'
      )}
      onClick={() => onSelect(template.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            'p-2.5 rounded-xl transition-colors',
            isSelected
              ? 'bg-gradient-to-br from-electric-indigo to-vibrant-fuchsia'
              : 'bg-elevated'
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {template.priority === 'critical' && (
          <Badge variant="purple" size="sm">
            Top Performer
          </Badge>
        )}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-text-primary mb-1.5">
        {template.name}
      </h3>
      <p className="text-sm text-text-muted mb-4 line-clamp-2">
        {template.shortDescription}
      </p>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {template.duration.min}-{template.duration.max}s
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <ConversionRating rating={template.conversionRating} />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {template.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full bg-elevated text-text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5 mt-4 text-sm font-medium text-electric-indigo"
        >
          <span>Selected</span>
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      )}
    </Card>
  );
}

// ============================================
// MAIN SELECTOR COMPONENT
// ============================================

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
  className?: string;
}

export function TemplateSelector({
  selectedTemplateId,
  onSelect,
  className,
}: TemplateSelectorProps) {
  const templates = getAllTemplates();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Choose a Video Template
        </h2>
        <p className="text-sm text-text-muted">
          Select a proven format optimized for conversions. Each template guides
          you through creating a high-performing UGC video.
        </p>
      </div>

      {/* Template Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {templates.map((template) => (
          <motion.div key={template.id} variants={itemVariants}>
            <TemplateCard
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={onSelect}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Info Note */}
      <div className="mt-6 flex items-start gap-2 p-3 rounded-lg bg-elevated/50">
        <Info className="w-4 h-4 text-electric-indigo mt-0.5 flex-shrink-0" />
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-primary">Pro tip:</span> These
          templates are based on data from millions of viral TikTok and Instagram
          videos. The &quot;Problem-Agitate-Solution&quot; format consistently achieves the
          highest conversion rates.
        </p>
      </div>
    </div>
  );
}
