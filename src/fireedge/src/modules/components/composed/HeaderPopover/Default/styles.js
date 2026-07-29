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

import { buttonClasses, Paper, Popper, styled } from '@mui/material'

export const StyledPopper = styled(Popper)(({ theme }) => ({
  boxShadow: theme.shadows[1],
  zIndex: theme.zIndex.modal + 1,
  [theme.breakpoints.down('xs')]: { width: '100%', height: '100%' },
}))

export const StyledPaper = styled(Paper)(({ theme }) => ({
  [theme.breakpoints.down('xs')]: { width: '100%', height: '100%' },
}))

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme
 * @param {boolean} root0.hasHeaderTitle - Has header title
 * @returns {object} - Header popover paper styles
 */
export const getPaperStyles = ({ theme, hasHeaderTitle }) => ({
  padding: hasHeaderTitle ? `${theme.scale[400]}px` : 0,
})

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isMobile - Is mobile viewport
 * @param {boolean} root0.hasButtonLabel - Has button label
 * @returns {object} - Header popover button styles
 */
export const getButtonStyles = ({ isMobile, hasButtonLabel }) => ({
  [`.${buttonClasses.startIcon}`]: {
    mr: !isMobile && hasButtonLabel ? 1 : 0,
  },
  borderRadius: '100rem',
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme
 * @returns {object} - Header popover mobile header styles
 */
export const getMobileHeaderStyles = ({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
})
