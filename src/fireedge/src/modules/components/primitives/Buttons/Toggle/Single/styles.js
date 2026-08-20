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

const getStateModifier = ({ isSelected, isDisabled }) => {
  switch (true) {
    case isDisabled:
      return {
        bgcolor: 'surface.primary',
        color: 'text.disabled',
        cursor: 'not-allowed',
      }
    case isSelected:
      return {
        bgcolor: 'surface.mute',
        color: 'text.selected',
        cursor: 'pointer',
      }
    default:
      return {
        bgcolor: 'surface.primary',
        color: 'text.body',
        cursor: 'pointer',
      }
  }
}

const getSizeModifier = ({ theme, size }) => {
  switch (size) {
    case 'small':
      return {
        padding: `${theme.scale[200]}px ${theme.scale[300]}px ${theme.scale[200]}px ${theme.scale[200]}px`,
      }
    case 'medium':
      return {
        padding: `${theme.scale[200]}px ${theme.scale[400]}px`,
      }
    case 'large':
      return {
        padding: `${theme.scale[400]}px ${theme.scale[550]}px`,
      }
    default:
      return {
        padding: `${theme.scale[200]}px ${theme.scale[300]}px ${theme.scale[200]}px ${theme.scale[200]}px`,
      }
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.size - Size dimensions of the circle
 * @param {boolean} root0.isOutlined - Add border
 * @param {boolean} root0.isDisabled - Is disabled
 * @param {boolean} root0.isSelected - Is selected
 * @returns {object} - Toggle button SX style
 */
export const getStyles = ({
  theme,
  size,
  isOutlined,
  isDisabled,
  isSelected,
}) => {
  const baseStyle = {
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
    whiteSpace: 'nowrap',
    borderRadius: `${theme.scale[150]}px`,
    fontStyle: 'normal',
    fontWeight: 500,
    border: `${theme.borderWidth.sm}px solid transparent`,

    fontSize: {
      xs: theme.fontSize.body.sm.mobile,
      sm: theme.fontSize.body.sm.tablet,
      md: theme.fontSize.body.sm.desktop,
    },
    lineHeight: {
      xs: theme.lineHeight.body.sm.mobile,
      sm: theme.lineHeight.body.sm.tablet,
      md: theme.lineHeight.body.sm.desktop,
    },

    ...(isOutlined && {
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    }),
    ...(!isDisabled && {
      '&:hover': {
        bgcolor: isSelected ? 'surface.actionHover2' : 'surface.actionHover4',
        color: isSelected ? 'text.actionHover' : 'text.body',
      },
      '&:focus-visible': {
        outline: `${theme.borderWidth.sm}px solid ${theme.palette.border.focus2}`,
        outlineOffset: '2px',
        bgcolor: isSelected ? 'surface.actionHover2' : 'surface.actionHover4',
      },
    }),
    ...getSizeModifier({ theme, size }),
    ...getStateModifier({ isSelected, isDisabled }),
  }

  return {
    ...baseStyle,
  }
}
