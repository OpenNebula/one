/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { css } from '@emotion/css'

/**
 * Create styles for the tabs.
 *
 * @param {object} theme - Theme
 * @param {object} theme.palette - Palette
 * @param {object} theme.zIndex - zIndex defined
 * @param {object} hidden - Hidden
 * @param {object} border - Add border
 * @returns {object} CSS styles with the palette
 */
const TabStyles = ({ palette, zIndex }, hidden, border) => ({
  tabTitle: css({
    position: 'sticky',
    top: 0,
    zIndex: zIndex.appBar,

    // MuiTabs applies to all tabs
    '&.MuiTabs-root': {
      backgroundColor: palette?.tabs.header.backgroundColor,
      borderRadius: `8px 8px 0 0`,
      borderLeft: `0.125rem solid ${palette?.tabs.header.borderColor}`,
      borderTop: `0.125rem solid ${palette?.tabs.header.borderColor}`,
      borderRight: `0.125rem solid ${palette?.tabs.header.borderColor}`,
      borderBottom: `0.0625rem solid ${palette?.tabs.header.insideBorderColor}`,
    },

    // Line behind each tab title
    '& .MuiTabs-indicator': {
      backgroundColor: palette?.tabs.header.indicatorColor,
    },

    // MuiTab applies to each tab (button)
    '& .MuiTab-root': {
      minHeight: '3rem',
    },

    // MuiTab applies to each header of each tab
    '& .MuiButtonBase-root': {
      backgroundColor: palette?.tabs.header.backgroundColor,
      color: palette?.tabs.header.color,
      textAlign: 'center',
      fontStyle: 'normal',
      fontWeight: 500,
      letterSpacing: '0.00625rem',
      fontSize: '1rem',
      lineHeight: '1.25rem',
      padding: '1rem 1rem 1rem 1rem',
      '&:hover': {
        backgroundColor: palette?.tabs.header.hover.backgroundColor,
        color: palette?.tabs.header.hover.color,
      },
      '&.Mui-selected': {
        backgroundColor: palette?.tabs.header.selected.backgroundColor,
        color: palette?.tabs.header.selected.color,
      },
    },
  }),
  tabContent: css({
    height: '100%',
    display: hidden ? 'none' : 'flex',
    flexDirection: 'column',
    ...(border && {
      backgroundColor: palette.tabs.content.backgroundColor,
      borderLeft: `0.125rem solid ${palette?.tabs.content.borderColor}`,
      borderTopStyle: `none`,
      borderRight: `0.125rem solid ${palette?.tabs.content.borderColor}`,
      borderBottom: `0.125rem solid ${palette?.tabs.content.borderColor}`,
    }),
    padding: '1rem',
  }),
  warningIcon: css({
    color: palette.error.main,
  }),
})

export default TabStyles
