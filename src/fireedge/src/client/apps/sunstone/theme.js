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
import Color from 'client/constants/color'
import { SCHEMES } from 'client/constants'

/**
 * @param {SCHEMES} scheme - Scheme type
 * @returns {object} Provision theme
 */
const theme = (scheme = SCHEMES.DARK) => ({
  palette: {
    type: scheme,
    common: {
      black: '#000000',
      white: '#ffffff'
    },
    background: {
      paper: scheme === SCHEMES.DARK ? '#2a2d3d' : '#ffffff',
      default: scheme === SCHEMES.DARK ? '#222431' : '#f2f4f8'
    },
    primary: {
      light: '#2a2d3d',
      main: '#222431',
      dark: '#191924',
      contrastText: '#ffffff'
    },
    secondary: {
      light: 'rgba(191, 230, 242, 1)',
      main: 'rgba(64, 179, 217, 1)',
      dark: 'rgba(0, 152, 195, 1)',
      contrastText: '#fff'
    },
    ...Color
  }
})

export default theme
