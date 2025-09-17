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
 * Create styles for the breadcrumb.
 *
 * @param {object} theme - Theme
 * @param {object} theme.palette - Palette
 * @returns {object} CSS styles with the palette
 */
const styles = ({ palette }) => ({
  item: css({
    marginTop: '1.875rem',
    marginBottom: '1rem',
  }),
  navigate: css({
    marginTop: '1rem',
    color: palette.breadCrumb.navigateDeactive.color,
    fontSize: '1rem',
  }),
  link: css({
    '&:hover': {
      textDecoration: 'none',
      color: palette.breadCrumb.navigateDeactive.hover.color,
    },
  }),
  parentText: css({
    color: palette.breadCrumb.navigateDeactive.color,
  }),
  linkActive: css({
    color: palette.breadCrumb.navigate.color,
    '&:hover': {
      textDecoration: 'none',
      color: palette.breadCrumb.navigate.color,
    },
  }),
  title: css({
    color: palette.breadCrumb.title.color,
    fontSize: '1.3125rem',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '1.25rem',
    underline: 'none',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'none',
    },
  }),
})

export default styles
