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
 * @param {object} theme - Current theme in use
 * @returns {object} Responsive title region width styles
 */
const getTitleRegionWidth = (theme) => ({
  xs: `min(65%, ${theme.scale[1800]}px)`,
  sm: `min(60%, ${theme.scale[1800] * 1.1}px)`,
  md: `min(55%, ${theme.scale[1800] * 1.2}px)`,
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Slot styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    display: 'flex',
    flexDirection: 'row',
    flex: '1 1 auto',
    minWidth: 0,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'flex-start',
  }

  const infoContainer = {
    '& .info-container': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      alignSelf: 'stretch',
      gap: `${theme.scale[600]}px`,
      flex: '1 1 auto',
      minWidth: 0,

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

  const header = {
    '& .info-top-row': {
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale[400]}px`,
      alignSelf: 'stretch',
      minWidth: 0,
      maxWidth: '100%',
    },
    '& .info-header': {
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale[100]}px`,
      flex: '0 0 auto',
      width: getTitleRegionWidth(theme),
      minWidth: 0,
      maxWidth: '100%',
      overflow: 'hidden',

      '& .icon-container': {
        flex: '0 0 auto',
        width: '40px',
        height: '40px',
        padding: '4px',

        borderRadius: `${theme.borderRadius.xlg}px`,
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

        '& .info-icon': {
          width: '100%',
          height: '100%',
          aspectRatio: '1/1',
        },
      },
      '& .info-title, & .info-id': {
        color: 'text.headings',
        fontFamily: 'Inter',
        fontSize: {
          xs: theme.fontSize.heading.h5.mobile,
          sm: theme.fontSize.heading.h5.tablet,
          md: theme.fontSize.heading.h5.desktop,
        },

        fontStyle: 'normal',
        fontWeight: 700,

        lineHeight: {
          xs: theme.lineHeight.heading.h5.mobile,
          sm: theme.lineHeight.heading.h5.tablet,
          md: theme.lineHeight.heading.h5.desktop,
        },
      },

      '& .info-title-wrapper': {
        display: 'flex',
        alignItems: 'center',
        gap: `${theme.scale[100]}px`,
        flex: '0 1 auto',
        width: 'fit-content',
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
      },

      '& .info-title, & .editable-title': {
        flex: '0 1 auto',
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },

      '& .info-id': {
        flex: '0 0 auto',
        color: 'text.onDisabled',
      },

      '& .info-title-wrapper > .MuiButton-root': {
        flex: '0 0 auto',
      },
    },
  }

  const captionTypography = {
    color: 'text.body',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: 400,
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
  }
  const ownership = {
    '& .info-metadata': {
      display: 'flex',
      flexDirection: 'column',
      gap: `${theme.scale[200]}px`,
      alignSelf: 'stretch',
      minWidth: 0,
    },
    '& .info-ownership': {
      display: 'flex',
      gap: `${theme.scale[100]}px`,
      rowGap: `${theme.scale[50]}px`,
      alignItems: 'center',
      alignSelf: 'stretch',
      flexWrap: 'wrap',
      minWidth: 0,

      '& .region-label': {
        display: 'flex',
        gap: `${theme.scale[50]}px`,
        minWidth: 0,
        maxWidth: '100%',
        '&::before': {
          content: '"\\2022"',
          marginRight: `${theme.scale[50]}px`,
          ...captionTypography,
        },
        '&:first-of-type::before': {
          display: 'none',
        },
        '& .region-label--title, & .region-label--value': {
          ...captionTypography,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },

        '& .region-label--title': {
          '&:not(:only-child)::after': {
            content: '":"',
          },
        },
      },
    },
    '& .info-tags': {
      display: 'flex',
      alignItems: 'center',
      minWidth: 0,
      maxWidth: '100%',
      overflow: 'visible',
    },
  }
  const toolbar = {
    '& .info-action-toggles': {
      display: 'flex',
      justifyContent: 'flex-end',
      flex: '1 1 0',
      minWidth: 0,
      maxWidth: '100%',
      overflow: 'hidden',
    },
  }

  return {
    ...baseStyles,
    ...infoContainer,
    ...header,
    ...ownership,
    ...toolbar,
  }
}

/**
 * @param {object} root0 - Params.
 * @param {object} root0.theme - Current theme in use.
 * @returns {object} Editable title styles.
 */
export const getEditableTitleStyles = ({ theme }) => {
  const baseStyles = {
    color: 'text.headings',
    cursor: 'pointer',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    display: 'inline-grid',
    width: 'fit-content',
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    borderRadius: `${theme.borderRadius['2xl']}px`,
    fontWeight: 700,
    fontSize: {
      xs: theme.fontSize.heading.h5.mobile,
      sm: theme.fontSize.heading.h5.tablet,
      md: theme.fontSize.heading.h5.desktop,
    },
    lineHeight: {
      xs: theme.lineHeight.heading.h5.mobile,
      sm: theme.lineHeight.heading.h5.tablet,
      md: theme.lineHeight.heading.h5.desktop,
    },

    '&:hover': {
      backgroundColor: theme.palette.surface.mute,
    },

    '&::after': {
      content: 'attr(data-value)',
      gridArea: '1 / 1',
      visibility: 'hidden',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '0 4px',
      font: 'inherit',
    },

    '&:has(.MuiInputBase-input:focus)': {
      backgroundColor: theme.palette.surface.mute,
      outline: `${theme.borderWidth.sm}px solid ${theme.palette.border.focus}`,
    },

    '&:not(.editable)': {
      pointerEvents: 'none',
      cursor: 'default',

      '&:hover': {
        backgroundColor: 'transparent',
      },
    },

    '& input.MuiInputBase-input': {
      gridArea: '1 / 1',
      width: 0,
      minWidth: '100%',
      boxSizing: 'border-box',
      padding: '0 4px',
      font: 'inherit',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  }

  return {
    ...baseStyles,
  }
}
