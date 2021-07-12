/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { ThemeOptions } from '@material-ui/core'
import { UbuntuFont } from 'client/theme/fonts'

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
  // DEVICES
  tablet: 640,
  laptop: 1024,
  desktop: 1280
}

export const toolbar = {
  regular: 56,
  xs: 48,
  sm: 64
}

export const footer = {
  regular: 30
}

export const sidebar = {
  minified: 60,
  fixed: 250
}

/** @type {ThemeOptions} */
export default {
  breakpoints: {
    values: breakpoints,
    keys: Object.keys(breakpoints)
  },
  typography: {
    fontFamily: [
      'Ubuntu',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(',')
  },
  mixins: {
    toolbar: {
      minHeight: toolbar.regular,
      [`@media (min-width:${breakpoints.xs}px) and (orientation: landscape)`]: {
        minHeight: toolbar.xs
      },
      [`@media (min-width:${breakpoints.sm}px)`]: {
        minHeight: toolbar.sm
      }
    }
  },
  overrides: {
    MuiFormControl: {
      root: {
        margin: '.5rem 0'
      }
    },
    MuiCssBaseline: {
      '@global': {
        '@font-face': [UbuntuFont]
      }
    }
  }
}
