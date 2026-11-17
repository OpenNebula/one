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
import { createTheme, ThemeOptions } from '@mui/material'
import { fonts } from '@modules/styles/typography'
import {
  scale,
  spacing,
  borderRadius,
  borderWidth,
  boxShadow,
  breakpoints,
  fontSize,
  fontWeight,
  lineHeight,
} from '@modules/styles/themes/responsive'
import { variables } from '@modules/styles/colors'
import { SCHEMES } from '@ConstantsModule'
import {
  Tabs,
  Table,
  Navigation,
  Page,
  Logo,
  Overrides,
  Graphs,
  ZIndex,
} from '@modules/styles/themes/layout'
import { schemes as colorSchemes } from '@modules/styles/colors/schemes'
import { primary } from '@modules/styles/colors/aliases'
import { white } from '@modules/styles/colors/variables'

const defaultTheme = createTheme()

/**
 * @param {SCHEMES} scheme - Scheme type
 * @returns {ThemeOptions} Material theme options
 */
export const createAppTheme = (scheme = SCHEMES.LIGHT) => {
  const nScheme = `${scheme}`?.toLowerCase()?.trim()
  const palette = colorSchemes?.[nScheme] ?? colorSchemes?.light

  return createTheme({
    palette: {
      ...palette,
      divider: palette.border.primary,
      primary: {
        default: primary.default,
        main: primary.default,
        contrastText: white,
      },
      background: Page.Background({ palette }),
      table: Table({ palette }),
      tabs: Tabs({ palette }),
      sidebar: Navigation.Sidebar({ palette }),
      logo: Logo,
      graphs: Graphs({ palette }),
      breadCrumb: Navigation.Breadcrumb({ palette }),
      login: {
        backgroundColor: variables.white,
      },
      debug: Page.Debug,
      common: Page.Common,
    },
    scale,
    custom: {
      spacing,
    },
    borderRadius,
    borderWidth,
    boxShadow,
    breakpoints: {
      values: breakpoints.width,
    },
    heightBreakpoints: {
      ...breakpoints.height,
    },
    fontSize,
    fontWeight,
    lineHeight,
    typography: {
      fontFamily: [fonts.inter.fontFamily, ...fonts.system].join(','),
      ...Object.fromEntries(
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((header) => [
          header,
          {
            [defaultTheme.breakpoints.down('sm')]: {
              fontSize: fontSize.heading[header].mobile,
              fontWeight: fontWeight.heading[header].mobile,
              lineHeight: lineHeight.heading[header].mobile,
            },
            [defaultTheme.breakpoints.between('sm', 'md')]: {
              fontSize: fontSize.heading[header].tablet,
              fontWeight: fontWeight.heading[header].tablet,
              lineHeight: lineHeight.heading[header].tablet,
            },
            [defaultTheme.breakpoints.up('md')]: {
              fontSize: fontSize.heading[header].desktop,
              fontWeight: fontWeight.heading[header].desktop,
              lineHeight: lineHeight.heading[header].desktop,
            },
          },
        ])
      ),
    },
    zIndex: {
      ...defaultTheme?.zIndex,
      ...ZIndex,
    },
    mixins: {
      toolbar: Overrides.Toolbar({ breakpoints: breakpoints.width }),
    },
    components: Overrides.Components({ palette, defaultTheme, fonts }),
  })
}
