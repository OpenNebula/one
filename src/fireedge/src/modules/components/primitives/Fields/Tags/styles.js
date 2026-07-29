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
 * @param {number} root0.placeholderMinWidth - Minimum width for placeholder
 * @param {number|string} root0.inputMinHeight - Minimum input height
 * @returns {object} - Tag input styles
 */
export const getStyles = ({ theme, placeholderMinWidth, inputMinHeight }) => ({
  boxSizing: 'border-box',
  width: '100%',
  minWidth: `${placeholderMinWidth}px`,
  maxWidth: '100%',
  contain: 'inline-size',

  '& .autocomplete-root': {
    width: '100%',
    minWidth: 0,
  },

  '& .textfield-container, & .textfield-root': {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    height: 'auto',
    flex: '0 0 auto',
  },

  '& .textfield-input-wrapper, && .textfield-input-wrapper': {
    boxSizing: 'border-box',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'flex-start',
    alignSelf: 'stretch',
    flex: '0 0 auto',
    width: '100%',
    maxWidth: '100%',
    minHeight:
      inputMinHeight == null
        ? `${theme.scale[1000]}px`
        : typeof inputMinHeight === 'number'
        ? `${inputMinHeight}px`
        : inputMinHeight,
    height: 'auto',
    overflow: 'hidden',
    padding: `${theme.scale[200]}px ${theme.scale[300]}px`,
    rowGap: `${theme.scale[100]}px`,
    columnGap: `${theme.scale[100]}px`,
  },

  '& .textfield-input, && .textfield-input': {
    boxSizing: 'border-box',
    flex: '1 1 auto',
    width: 'auto !important',
    minWidth: `${placeholderMinWidth - 48}px`,
    maxWidth: '100%',
    height: 'auto',
    padding: '0 !important',
  },

  '&.has-values .textfield-input, &&.has-values .textfield-input': {
    flex: '0 1 56px',
    width: 'auto !important',
    minWidth: '16px',
  },

  '& .inputfield-hint': {
    marginTop: `${theme.scale[100]}px`,
  },

  '& .MuiAutocomplete-tag': {
    margin: 0,
    minWidth: 0,
    flexShrink: 1,
    maxWidth: '100%',
  },

  '& .autocomplete-tag': {
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',

    '& .MuiButton-endIcon': {
      flex: '0 0 auto',
    },

    '& .MuiButton-endIcon svg': {
      width: `${theme.scale[400]}px`,
      height: `${theme.scale[400]}px`,
      strokeWidth: 1.6,
    },
  },

  '& .MuiAutocomplete-endAdornment': {
    position: 'static',
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    transform: 'none',
  },

  '& .MuiAutocomplete-clearIndicator, & .MuiAutocomplete-popupIndicator': {
    padding: `${theme.scale[50]}px`,
    color: 'icon.primary',
  },
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Autocomplete menu paper styles
 */
export const getMenuStyles = ({ theme }) => ({
  display: 'flex',
  padding: `${theme.scale[100]}px`,
  alignItems: 'flex-start',
  alignSelf: 'stretch',
  borderRadius: `${theme.borderRadius.xlg}px`,
  border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  bgcolor: 'surface.primary',
  boxShadow:
    '0 4px 10px -4px rgba(0, 0, 0, 0.09), 0 2px 4px -16px rgba(0, 0, 0, 0.10)',
  marginTop: `${theme.scale[100]}px`,
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {number} root0.rowsDisplayed - Number of visible options
 * @returns {object} - Autocomplete list styles
 */
export const getListStyles = ({ theme, rowsDisplayed }) => ({
  width: '100%',
  maxHeight: `${rowsDisplayed * 36}px`,

  '& .autocomplete-option': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: `${theme.scale[50]}px`,
    alignSelf: 'stretch',
    padding: `${theme.scale[150]}px ${theme.scale[200]}px`,
    borderRadius: `${theme.borderRadius.xlg}px`,
    color: 'text.body',

    '&[aria-selected="true"], &.Mui-focused': {
      bgcolor: 'surface.actionHover4',
      color: 'text.actionHover2',
    },
  },

  '& .autocomplete-option-text': {
    fontWeight: 600,
  },

  '& .autocomplete-option-description': {
    color: 'text.disabled',
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
})
