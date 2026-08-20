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
 * @param {string} root0.variant - Text variant
 * @param {string} root0.weight - Text weight
 * @returns {object} - Text SX style
 */
export const getStyles = ({ theme, variant, weight }) => {
  const variantStyles = {
    H1: {
      fontSize: {
        xs: theme.fontSize.heading.h1.mobile,
        sm: theme.fontSize.heading.h1.tablet,
        md: theme.fontSize.heading.h1.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.heading.h1.mobile,
        sm: theme.lineHeight.heading.h1.tablet,
        md: theme.lineHeight.heading.h1.desktop,
      },
    },
    H2: {
      fontSize: {
        xs: theme.fontSize.heading.h2.mobile,
        sm: theme.fontSize.heading.h2.tablet,
        md: theme.fontSize.heading.h2.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.heading.h2.mobile,
        sm: theme.lineHeight.heading.h2.tablet,
        md: theme.lineHeight.heading.h2.desktop,
      },
    },
    H3: {
      fontSize: {
        xs: theme.fontSize.heading.h3.mobile,
        sm: theme.fontSize.heading.h3.tablet,
        md: theme.fontSize.heading.h3.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.heading.h3.mobile,
        sm: theme.lineHeight.heading.h3.tablet,
        md: theme.lineHeight.heading.h3.desktop,
      },
    },
    H4: {
      fontSize: {
        xs: theme.fontSize.heading.h4.mobile,
        sm: theme.fontSize.heading.h4.tablet,
        md: theme.fontSize.heading.h4.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.heading.h4.mobile,
        sm: theme.lineHeight.heading.h4.tablet,
        md: theme.lineHeight.heading.h4.desktop,
      },
    },
    H5: {
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
    },
    H6: {
      fontSize: {
        xs: theme.fontSize.heading.h6.mobile,
        sm: theme.fontSize.heading.h6.tablet,
        md: theme.fontSize.heading.h6.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.heading.h6.mobile,
        sm: theme.lineHeight.heading.h6.tablet,
        md: theme.lineHeight.heading.h6.desktop,
      },
    },
    BODY_LARGE: {
      fontSize: {
        xs: theme.fontSize.body.lg.mobile,
        sm: theme.fontSize.body.lg.tablet,
        md: theme.fontSize.body.lg.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.lg.mobile,
        sm: theme.lineHeight.body.lg.tablet,
        md: theme.lineHeight.body.lg.desktop,
      },
    },
    BODY_MEDIUM: {
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
    BODY_SMALL: {
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
    CAPTION: {
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
  }

  const weightStyles = {
    BOLD: {
      fontWeight: {
        xs: 700,
        sm: 700,
        md: 700,
      },
    },
    SEMIBOLD: {
      fontWeight: {
        xs: 600,
        sm: 600,
        md: 600,
      },
    },
    REGULAR: {
      fontWeight: {
        xs: 400,
        sm: 400,
        md: 400,
      },
    },
    MEDIUM: {
      fontWeight: {
        xs: 500,
        sm: 500,
        md: 500,
      },
    },
  }

  const colorStyles = {
    H1: { color: 'text.headings' },
    H2: { color: 'text.headings' },
    H3: { color: 'text.headings' },
    H4: { color: 'text.headings' },
    H5: { color: 'text.headings' },
    H6: { color: 'text.headings' },
    BODY_LARGE: { color: 'text.body' },
    BODY_MEDIUM: { color: 'text.body' },
    BODY_SMALL: { color: 'text.body' },
    CAPTION: { color: 'text.body' },
  }

  return {
    ...variantStyles?.[variant],
    ...weightStyles?.[weight],
    ...colorStyles?.[variant],
  }
}
