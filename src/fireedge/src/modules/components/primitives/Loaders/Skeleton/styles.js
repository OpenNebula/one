/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

import { alpha } from '@mui/material/styles'

const normalizeDimension = (dimension) => {
  if (typeof dimension === 'number') return `${dimension}px`

  if (dimension && typeof dimension === 'object') {
    return Object.fromEntries(
      Object.entries(dimension).map(([breakpoint, value]) => [
        breakpoint,
        normalizeDimension(value),
      ])
    )
  }

  return dimension
}

const resolveRadius = ({ theme, variant, borderRadius }) => {
  if (borderRadius !== undefined) {
    if (
      typeof borderRadius === 'string' &&
      theme.borderRadius[borderRadius] !== undefined
    ) {
      return `${theme.borderRadius[borderRadius]}px`
    }

    return typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
  }

  switch (variant) {
    case 'circular':
      return `${theme.borderRadius.round}px`
    case 'rectangular':
      return `${theme.borderRadius.none}px`
    default:
      return `${theme.borderRadius.md}px`
  }
}

/**
 * Styles for the skeleton loading placeholder.
 *
 * @param {object} props - Style properties
 * @param {object} props.theme - MUI theme
 * @param {number|string|object} props.width - Placeholder width
 * @param {number|string|object} props.height - Placeholder height
 * @param {string} props.variant - Placeholder shape
 * @param {number|string} props.borderRadius - Radius override
 * @param {'pulse'|'wave'|false} props.animation - Loading animation
 * @returns {object} MUI styles
 */
export const getStyles = ({
  theme,
  width,
  height,
  variant,
  borderRadius,
  animation,
}) => {
  const defaultSize = `${theme.scale[500]}px`
  const resolvedHeight = normalizeDimension(height) ?? defaultSize
  const resolvedWidth =
    normalizeDimension(width) ??
    (variant === 'circular' ? resolvedHeight : '100%')
  const waveHighlight = theme.palette.surface.skeletonHighlight

  return {
    position: 'relative',
    display: 'block',
    width: resolvedWidth,
    height: resolvedHeight,
    minWidth: 0,
    overflow: 'hidden',
    borderRadius: resolveRadius({ theme, variant, borderRadius }),
    bgcolor: 'surface.skeleton',
    pointerEvents: 'none',
    userSelect: 'none',
    ...(animation === 'pulse' && {
      animation: 'skeleton-loading-pulse 1.5s ease-in-out infinite',
      '@keyframes skeleton-loading-pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.55 },
      },
    }),
    ...(animation === 'wave' && {
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        transform: 'translateX(-100%)',
        background: `linear-gradient(
          90deg,
          ${alpha(waveHighlight, 0)} 0%,
          ${alpha(waveHighlight, 0.15)} 15%,
          ${alpha(waveHighlight, 0.5)} 45%,
          ${alpha(waveHighlight, 0.5)} 55%,
          ${alpha(waveHighlight, 0.15)} 85%,
          ${alpha(waveHighlight, 0)} 100%
        )`,
        animation: 'skeleton-loading-wave 2s infinite',
      },
      '@keyframes skeleton-loading-wave': {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
    }),
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      '&::after': {
        animation: 'none',
      },
    },
  }
}
