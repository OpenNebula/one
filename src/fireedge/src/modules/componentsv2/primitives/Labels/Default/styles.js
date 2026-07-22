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
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.tooltip - Render tooltip if populated
 * @param {boolean} root0.isRequired - Render asterisk isRequired icon
 * @param {boolean} root0.isOptional - Render isOptional banner
 * @returns {object} - Label SX style
 */
export const getStyles = ({ theme, isRequired, isOptional, tooltip }) => {
  const baseStyle = {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: `${theme.scale[100]}px`,
  }

  const label = {
    '& .label': {
      color: 'text.headings',
      minWidth: 'unset',
      minHeight: 'unset',
      width: 'auto',
      height: 'auto',
      fontSize: {
        xs: theme.fontSize.body.sm.mobile,
        sm: theme.fontSize.body.sm.tablet,
        md: theme.fontSize.body.sm.desktop,
      },
      fontWeight: {
        xs: theme.fontWeight.body.sm.mobile,
        sm: theme.fontWeight.body.sm.tablet,
        md: theme.fontWeight.body.sm.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
    },
  }

  const tooltipIcon = {
    '& .tooltip-icon': {
      color: 'text.action',
      width: `${theme.scale[400]}px`,
      height: `${theme.scale[400]}px`,
      aspectRatio: '1/1',
    },
  }

  const isRequiredIcon = {
    '& .isRequired-icon': {
      color: 'icon.action',
      position: 'absolute',
      left: '-7.5px',
      top: '-7px',
      width: '4.726px',
      height: '4.909px',
    },
  }

  const isOptionalBanner = {
    '& .isOptional-banner': {
      color: 'text.onDisabled',
      textTransform: 'lowercase',
      fontWeight: 300,
      fontSize: {
        xs: theme.fontSize.body.caption.mobile,
        sm: theme.fontSize.body.caption.tablet,
        md: theme.fontSize.body.caption.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.caption.mobile,
        sm: theme.lineHeight.body.caption.tablet,
        md: theme.lineHeight.body.caption.desktop,
      },
    },
  }

  return {
    ...baseStyle,

    ...label,
    ...(tooltip && tooltipIcon),
    ...(isRequired && isRequiredIcon),
    ...(isOptional && isOptionalBanner),
  }
}
