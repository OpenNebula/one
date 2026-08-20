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
 * @param {object} root0 - Params.
 * @param {object} root0.theme - Current theme in use.
 * @param {boolean} root0.isLabelVisible - Whether to show label.
 * @param {number} root0.diameter - Circle diameter
 * @param {number} root0.strokeWidth - SVG stroke width
 * @param {object} root0.fontSize - Responsive font size declaration
 * @param {object} root0.lineHeight - Responsive line height declaration
 * @returns {object} - ProgressCircle SX style.
 */
export const getStyles = ({
  theme,
  isLabelVisible,
  diameter,
  strokeWidth,
  fontSize,
  lineHeight,
}) => {
  // Base container styles
  const baseStyle = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${diameter}px`,
    height: `${diameter}px`,
    aspectRatio: '1/1',
  }

  // SVG container styles
  const svgContainer = {
    '& .progress-svg': {
      width: '100%',
      height: '100%',
      transform: 'rotate(-90deg)',
    },
  }

  // Track (background circle) styles
  const track = {
    '& .progress-circle-track': {
      fill: 'none',
      stroke: theme.palette.surface.disabledSelected,
      strokeWidth: strokeWidth,
    },
  }

  // Fill (progress indicator) styles
  const fill = {
    '& .progress-circle-fill': {
      fill: 'none',
      stroke: theme.palette.border.action,
      strokeWidth: strokeWidth,
      strokeLinecap: 'butt',
    },
  }

  // Label styles (centered text)
  const label = {
    '& .progress-circle-label': {
      display: isLabelVisible ? 'block' : 'none',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'text.action',
      fontSize: {
        xs: fontSize.mobile,
        sm: fontSize.tablet,
        md: fontSize.desktop,
      },
      fontWeight: 400,
      lineHeight: {
        xs: lineHeight.mobile,
        sm: lineHeight.tablet,
        md: lineHeight.desktop,
      },
    },
  }

  return {
    ...baseStyle,
    ...svgContainer,
    ...track,
    ...fill,
    ...label,
  }
}
