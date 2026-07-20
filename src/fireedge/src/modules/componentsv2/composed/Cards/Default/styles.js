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
 * @param {boolean} root0.isSelected - Selected
 * @returns {object} - Fields styles
 */
export const getStyles = ({ theme, isSelected }) => {
  const baseStyles = {
    display: 'flex',
    padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
    gap: `${theme.scale[100]}px`,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: isSelected ? 'surface.focus2' : 'surface.primary',
    flex: '1 1 0',
    borderLeft: `3px solid ${
      isSelected ? theme.palette.icon.focus : 'transparent'
    }`,

    '&:hover': {
      cursor: 'pointer',
      bgcolor: 'surface.actionHover4',
    },

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
  }

  const info = {
    '& .card-info': {
      display: 'flex',
      gap: `${theme.scale[200]}px`,
      alignItems: 'flex-start',
      alignSelf: 'stretch',
    },
  }

  const checkBox = {
    '& .card-checkbox': {
      display: 'flex',
      width: '16px',
      height: '16px',
      marginTop: `${theme.scale[200]}px`,
      padding: 0,
      justifyContent: 'center',
      alignItems: 'center',
      gap: `${theme.scale[300]}px`,
      aspectRatio: '1/1',
    },
  }

  const details = {
    '& .card-details': {
      display: 'flex',
      gap: `${theme.scale[100]}px`,
      alignItems: 'flex-start',
      flex: '1 0 0',
    },
  }

  const image = {
    '& .avatar-image': {
      bgcolor: 'surface.imageBg',
    },
  }

  const slots = {
    '& .card-slots': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: `${theme.scale[100]}px`,
      flex: '1 0 0',
    },
  }

  return {
    ...baseStyles,
    ...info,
    ...checkBox,
    ...details,
    ...image,
    ...slots,
  }
}
