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
 * @returns {object} - Detailsdrawer styles
 */
export const getStyles = ({ theme }) => {
  const paperProps = {
    '& .documentationdrawer-paper': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: `${theme.scale[600]}px ${theme.scale[700]}px`,

      width: 'calc(30vw - var(--sidebar-width, 0px))',
      height: 'calc(100vh - var(--sidebar-header-height, 0px))',
      marginTop: 'var(--sidebar-header-height, 0px)',

      borderRadius: `${theme.borderRadius?.['4xl']}px 0 0 ${theme.borderRadius?.['4xl']}px`,
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderRight: `${theme.borderWidth.none}px solid ${theme.palette.border.primary}`,
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderLeft: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      bgcolor: 'surface.primary',
      color: 'text.body',
      boxShadow:
        '-119px 0 33px 0 rgba(0, 0, 0, 0.00), -76px 0 30px 0 rgba(0, 0, 0, 0.01), -43px 0 26px 0 rgba(0, 0, 0, 0.02), -19px 0 19px 0 rgba(0, 0, 0, 0.03), -5px 0 10px 0 rgba(0, 0, 0, 0.04)',
    },
  }

  const content = {
    '& .documentationdrawer-container': {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 auto',
      justifyContent: 'flex-start',
      gap: `${theme.scale[600]}px`,
      minHeight: 0,
      overflowY: 'auto',
    },
    '& .documentationdrawer-header': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    },
    '& .documentationdrawer-guides': {
      color: 'text.headings',
      fontSize: {
        xs: theme.fontSize.heading.h6.mobile,
        sm: theme.fontSize.heading.h6.tablet,
        md: theme.fontSize.heading.h6.desktop,
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
    },
    '& .documentationdrawer-title': {
      color: 'text.headings',
      fontSize: {
        xs: theme.fontSize.heading.h4.mobile,
        sm: theme.fontSize.heading.h4.tablet,
        md: theme.fontSize.heading.h4.desktop,
      },
      fontWeight: {
        xs: theme.fontWeight.heading.h4.mobile,
        sm: theme.fontWeight.heading.h4.tablet,
        md: theme.fontWeight.heading.h4.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.heading.h4.mobile,
        sm: theme.lineHeight.heading.h4.tablet,
        md: theme.lineHeight.heading.h4.desktop,
      },
    },
    '& .documentationdrawer-paragraph': {
      display: 'flex',
      flexDirection: 'column',
      gap: `${theme.scale[200]}px`,
      justifyContent: 'flex-start',
      alignSelf: 'stretch',
      color: 'text.body',
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
    '& .documentationdrawer-link': {
      width: '100%',
      height: 'fit-content',
      flex: '0 0 auto',
      alignSelf: 'stretch',
    },
  }

  return {
    ...content,
    ...paperProps,
  }
}
