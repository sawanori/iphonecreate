'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVideoStore } from '@/stores/videoStore';
import type { Choice } from '@/types';

/**
 * ChoiceOverlay component Props
 * Design doc: DESIGN-FE-2026-001 Section 5.1, 5.5
 * Task: phase2-003-choice-overlay.md, phase2-007-responsive.md
 */
export interface ChoiceOverlayProps {
  /** Choices to display (max 2) */
  choices: Choice[];
  /** Visibility state */
  isVisible: boolean;
  /** Callback when a choice is selected */
  onSelect: (choice: Choice) => void;
  /** Remaining time in seconds */
  remainingTime?: number;
  /** Time limit in seconds */
  timeLimit?: number;
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Choice overlay component
 * Displays 2 choice buttons overlaid on video with animation
 * Supports keyboard navigation (Tab, Enter, 1/2 keys)
 *
 * Acceptance Criteria:
 * - AC-V-002: Display 2 choices at specified timing
 * - AC-V-006: 320px width shows vertical layout
 * - Choice display delay must be within 0.5 seconds
 * - Smooth fade-in/fade-out animation
 * - Keyboard accessible (Tab, Enter)
 * - Touch-friendly (min 48x48px tap target)
 */
export function ChoiceOverlay({
  choices,
  isVisible,
  onSelect,
  remainingTime,
  timeLimit,
  className,
  disabled = false,
}: ChoiceOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);

  // Get selection confirmation state from store
  const {
    selectedChoiceId: storeSelectedId,
    isConfirmingSelection,
    preloadProgress,
  } = useVideoStore();

  // Use store's selectedChoiceId if in confirmation mode, otherwise use local
  const selectedChoiceId = isConfirmingSelection ? storeSelectedId : localSelectedId;

  // Handle choice click (defined before useEffect to avoid reference issues)
  const handleChoiceClick = useCallback(
    (choice: Choice) => {
      if (disabled || selectedChoiceId || isConfirmingSelection) return;

      setLocalSelectedId(choice.id);
      // Execute callback immediately - the delay will be handled by useVideoPlayer
      onSelect(choice);
    },
    [disabled, selectedChoiceId, isConfirmingSelection, onSelect]
  );

  // Start animation when becoming visible - use microtask to avoid synchronous setState
  useEffect(() => {
    if (isVisible) {
      queueMicrotask(() => {
        setIsAnimating(true);
        setLocalSelectedId(null);
      });
    }
  }, [isVisible]);

  // Handle keyboard shortcuts (1/2 keys for quick selection)
  useEffect(() => {
    if (!isVisible || disabled || selectedChoiceId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Choices are displayed in array order (index 0 = choice 1, index 1 = choice 2)
      if (event.key === '1' && choices[0]) {
        event.preventDefault();
        handleChoiceClick(choices[0]);
      } else if (event.key === '2' && choices[1]) {
        event.preventDefault();
        handleChoiceClick(choices[1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, disabled, selectedChoiceId, choices, handleChoiceClick]);

  // Don't render if not visible
  if (!isVisible) return null;

  // Use choices as provided (order is implicit in array index)
  const sortedChoices = choices;

  // Calculate time progress percentage
  const timeProgress = timeLimit && remainingTime !== undefined
    ? (remainingTime / timeLimit) * 100
    : 100;

  // Warning state when time is low
  const isTimeLow = timeProgress < 30;

  return (
    <div
      className={cn(
        'choice-overlay absolute inset-0 flex flex-col items-center justify-center',
        'bg-black/70 backdrop-blur-sm z-20',
        // Responsive padding
        'p-4 sm:p-6 md:p-8',
        isAnimating && 'animate-in fade-in duration-300',
        className
      )}
      role="dialog"
      aria-label="選択肢を選んでください"
      aria-modal="true"
    >
      {/* Timer display - Responsive */}
      {timeLimit && remainingTime !== undefined && (
        <div className="mb-4 sm:mb-6 md:mb-8 text-center">
          <p
            className={cn(
              'text-xl sm:text-2xl font-bold mb-2 transition-colors',
              isTimeLow ? 'text-red-400' : 'text-white'
            )}
            role="timer"
            aria-live="polite"
            aria-label={`残り時間: ${remainingTime.toFixed(1)}秒`}
          >
            残り時間: {remainingTime.toFixed(1)}秒
          </p>
          <div
            className="w-48 sm:w-56 md:w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto"
            role="progressbar"
            aria-valuenow={Math.round(timeProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                'h-full transition-all duration-100 ease-linear',
                isTimeLow ? 'bg-red-500' : 'bg-blue-500'
              )}
              style={{ width: `${timeProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Choice buttons - Responsive: vertical on xs/mobile, horizontal on sm+ */}
      <div
        className={cn(
          'flex w-full max-w-2xl',
          // Vertical layout by default (mobile/xs), horizontal on sm+
          'flex-col sm:flex-row',
          'gap-3 sm:gap-4',
          'px-2 sm:px-4'
        )}
      >
        {sortedChoices.map((choice, index) => {
          const isSelected = selectedChoiceId === choice.id;
          const hasSelection = selectedChoiceId !== null;

          return (
            <Button
              key={choice.id}
              onClick={() => handleChoiceClick(choice)}
              disabled={disabled || hasSelection}
              size="lg"
              variant={isSelected ? 'default' : 'secondary'}
              className={cn(
                'choice-button flex-1 relative overflow-hidden',
                // Min tap target: 48x48px (WCAG requirement)
                'min-h-[48px] sm:min-h-[56px] md:min-h-[64px]',
                // Touch-friendly
                'touch-manipulation',
                // Responsive text size
                'text-base sm:text-lg',
                // Responsive padding
                'px-4 py-3 sm:px-6 sm:py-4',
                // Animation
                'transition-all duration-500',
                !hasSelection && 'hover:scale-105 active:scale-95',
                // Focus ring for accessibility
                'focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black',
                'focus:outline-none',
                // Animation delay for staggered entrance
                isAnimating && !hasSelection && 'animate-in slide-in-from-bottom duration-300',
                // Selected state - more prominent styling
                isSelected && isConfirmingSelection && [
                  'scale-110 z-10',
                  'ring-4 ring-primary',
                  'bg-primary text-primary-foreground',
                  'shadow-lg shadow-primary/50',
                  'animate-pulse',
                ],
                // Non-selected when another is selected
                hasSelection && !isSelected && [
                  'opacity-30 scale-90',
                  'pointer-events-none',
                ]
              )}
              style={{
                animationDelay: hasSelection ? '0ms' : `${index * 100}ms`,
              }}
              aria-pressed={isSelected}
              aria-label={`選択肢${index + 1}: ${choice.label}。${index + 1}を押して選択。`}
            >
              <span className="mr-2 text-sm opacity-70">{index + 1}.</span>
              <span className="line-clamp-2">{choice.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Selection feedback - Responsive */}
      {isConfirmingSelection && selectedChoiceId && (
        <div className="mt-4 sm:mt-6 text-center animate-in fade-in duration-200">
          {/* Confirmation progress bar */}
          <div className="w-48 sm:w-64 h-1.5 bg-gray-700 rounded-full overflow-hidden mx-auto mb-2">
            <div
              className="h-full bg-primary transition-all duration-100 ease-linear"
              style={{ width: `${Math.min(100, preloadProgress)}%` }}
            />
          </div>
          <p
            className="text-white text-base sm:text-lg"
            aria-live="polite"
          >
            {preloadProgress < 100 ? '次の動画を読み込み中...' : '準備完了'}
          </p>
        </div>
      )}

      {/* Keyboard hint - Hidden on small screens for cleaner UI */}
      <p className="hidden sm:block mt-4 text-gray-400 text-sm">
        1または2キーで選択、またはTabとEnterで操作
      </p>
    </div>
  );
}
