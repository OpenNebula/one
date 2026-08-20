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
 * @returns {object} - Accordion SX style
 */
export const getStyles = ({ theme }) => {
  const baseStyle = {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'start',
    gap: 0,
    flexShrink: 0,

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

  const accordionBase = {
    '& .accordion-base': {
      display: 'flex',
      flexDirection: 'column',
      padding: `${theme.scale[500]}px`,
      // gap: `${theme.scale[500]}px`, // TODO check with Andres
      gap: 0,
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: 'transparent',
      boxShadow: 'none',

      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

      '&::before': {
        display: 'none',
      },

      '&:hover': {
        '& .accordion-title': {
          textDecoration: 'underline',
        },
      },
    },

    '& .accordion-expanded': {
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: `${theme.scale[500]}px`,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
  }

  const accordionSummary = {
    '& .accordion-summary': {
      display: 'flex',
      width: '100%',
      padding: 0,

      '& .MuiAccordionSummary-expandIconWrapper': {
        display: 'flex',
        color: 'icon.primary',

        '& svg': {
          width: `${theme.scale[500]}px`,
          height: `${theme.scale[500]}px`,
        },
      },
    },
  }

  const accordionDetails = {
    '& .accordion-details': {
      display: 'flex',
      width: '100%',
      padding: 0,
    },
  }

  const accordionTitle = {
    '& .accordion-title': {
      flex: '1 0 0',
      color: 'text.body',

      fontStyle: 'normal',
      fontWeight: 600,
      fontSize: {
        xs: theme.fontSize.body.md.mobile,
        sm: theme.fontSize.body.md.tablet,
        md: theme.fontSize.body.md.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.md.mobile,
        sm: theme.lineHeight.body.md.tablet,
        md: theme.lineHeight.body.md.desktop,
      },
    },
  }

  const accordionDescription = {
    '& .accordion-description': {
      alignSelf: 'stretch',
      color: 'text.body',

      fontStyle: 'normal',
      fontWeight: 400,
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
    },
  }

  return {
    ...baseStyle,
    ...accordionBase,
    ...accordionSummary,
    ...accordionDetails,
    ...accordionTitle,
    ...accordionDescription,
  }
}
