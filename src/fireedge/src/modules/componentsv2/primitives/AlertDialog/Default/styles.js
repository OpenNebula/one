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
 * @param {string|object} root0.dialogWidth - Dialog paper width
 * @param {string|object} root0.dialogMinWidth - Dialog paper min-width
 * @param {string|object} root0.dialogMaxWidth - Dialog paper max-width
 * @param {string|object} root0.dialogMaxHeight - Dialog paper max-height
 * @param {string} root0.dialogPaperOverflow - Dialog paper overflow
 * @returns {object} - AlertDialog container SX style
 */
export const useDialogStyles = ({
  theme,
  dialogWidth,
  dialogMinWidth = '320px',
  dialogMaxWidth = '480px',
  dialogMaxHeight,
  dialogPaperOverflow,
}) => ({
  '& .MuiBackdrop-root': {
    backgroundColor: 'transparent',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  },

  '& .MuiDialog-paper': {
    bgcolor: 'surface.page',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    borderRadius: `${theme.borderRadius?.['3xl']}px`,
    boxShadow:
      '0 4px 6px -4px rgba(0, 0, 0, 0.10), 0 10px 15px -13px rgba(0, 0, 0, 0.10)',
    padding: `${theme.scale[600] - theme.scale[100]}px`,
    gap: 0,
    minWidth: dialogMinWidth,
    maxWidth: dialogMaxWidth,
    ...(dialogWidth && { width: dialogWidth }),
    ...(dialogMaxHeight && { maxHeight: dialogMaxHeight }),
    ...(dialogPaperOverflow && { overflow: dialogPaperOverflow }),
  },
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - AlertDialog content wrapper SX style
 */
export const useContentWrapperStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  padding: `${theme.scale[100]}px`,
  boxSizing: 'border-box',
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - AlertDialog header SX style
 */
export const useHeaderStyles = ({ theme }) => ({
  padding: 0,
  marginBottom: `${theme.scale[500]}px`,
  color: 'text.headings',
  fontSize: {
    xs: theme.fontSize.heading.h5.mobile,
    sm: theme.fontSize.heading.h5.tablet,
    md: theme.fontSize.heading.h5.desktop,
  },
  fontWeight: {
    xs: theme.fontWeight.heading.h5.mobile,
    sm: theme.fontWeight.heading.h5.tablet,
    md: theme.fontWeight.heading.h5.desktop,
  },
  lineHeight: {
    xs: theme.lineHeight.heading.h5.mobile,
    sm: theme.lineHeight.heading.h5.tablet,
    md: theme.lineHeight.heading.h5.desktop,
  },
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - AlertDialog description SX style
 */
export const useDescriptionStyles = ({ theme }) => ({
  padding: 0,
  color: 'text.body',
  fontSize: {
    xs: theme.fontSize.body.md.mobile,
    sm: theme.fontSize.body.md.tablet,
    md: theme.fontSize.body.md.desktop,
  },
  fontWeight: {
    xs: theme.fontWeight.body.md.mobile,
    sm: theme.fontWeight.body.md.tablet,
    md: theme.fontWeight.body.md.desktop,
  },
  lineHeight: {
    xs: theme.lineHeight.body.md.mobile,
    sm: theme.lineHeight.body.md.tablet,
    md: theme.lineHeight.body.md.desktop,
  },
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - AlertDialog actions container SX style
 */
export const useActionsStyles = ({ theme }) => ({
  padding: 0,
  marginTop: `${theme.scale[400]}px`,
  gap: `${theme.scale[400]}px`,
  flexDirection: {
    xs: 'column-reverse',
    sm: 'row',
  },
  justifyContent: {
    xs: 'stretch',
    sm: 'flex-end',
  },
  '& > button': {
    width: {
      xs: '100%',
      sm: 'auto',
    },
  },
})
