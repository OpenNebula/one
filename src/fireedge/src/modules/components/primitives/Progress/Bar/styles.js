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

/**
 * Get bar height based on size.
 *
 * @param {object} theme - Theme object.
 * @param {string} size - Size variant (sx, sm, md, lg).
 * @returns {string} - Bar height in pixels.
 */
export const getBarHeight = (theme, size) => {
  const heightMap = {
    extraSmall: `${theme.scale[100]}px`,
    small: `${theme.scale[200]}px`,
    medium: `${theme.scale[400]}px`,
    large: `${theme.scale[500]}px`,
  }

  return heightMap[size] || heightMap.md
}

const getFillColor = ({ clampedValue, thresholds }) => {
  if (!thresholds) return 'icon.action'

  const [low, high] = thresholds

  if (clampedValue < low) return 'icon.success'
  if (clampedValue > high) return 'icon.onDestructive'

  return 'icon.warning'
}

/**
 * @param {object} root0 - Params.
 * @param {object} root0.theme - Current theme in use.
 * @param {string} root0.size - Size variant (sx, sm, md, lg).
 * @param {boolean} root0.isLabelVisible - Whether to show label.
 * @param {number} root0.clampedValue - 0-100 progress.
 * @param {number[]} root0.thresholds - Low/high values for range coloring.
 * @returns {object} - ProgressBar SX style.
 */
export const getStyles = ({
  theme,
  size,
  isLabelVisible,
  clampedValue = 0,
  thresholds,
}) => {
  const barHeight = getBarHeight(theme, size)
  const fillColor = getFillColor({ clampedValue, thresholds })

  // Base container styles
  const baseStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: `${theme.scale[100]}px`,
  }

  // Label styles
  const label = {
    '& .progress-label': {
      display: isLabelVisible ? 'block' : 'none',
      color: 'text.action',
      fontSize: {
        xs: theme.fontSize.body.caption.mobile,
        sm: theme.fontSize.body.caption.tablet,
        md: theme.fontSize.body.caption.desktop,
      },
      fontWeight: 500,
      lineHeight: {
        xs: theme.lineHeight.body.caption.mobile,
        sm: theme.lineHeight.body.caption.tablet,
        md: theme.lineHeight.body.caption.desktop,
      },
    },
  }

  // Track (background) styles
  const track = {
    '& .progress-track': {
      height: barHeight,
      borderRadius: `${theme.borderRadius.round}px`,
      padding: theme.scale[0],
      position: 'relative',
      width: '100%',
      backgroundColor: 'surface.disabled2',
      overflow: 'hidden',
    },
  }

  // Fill (progress indicator) styles
  const fill = {
    '& .progress-fill': {
      position: 'absolute',
      width: `${clampedValue}%`,
      top: 0,
      left: 0,
      height: barHeight,
      backgroundColor: fillColor,
      borderRadius: `${theme.borderRadius.round}px`,
    },
  }

  return {
    ...baseStyle,
    ...label,
    ...track,
    ...fill,
  }
}
