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

import { SCHEMES } from '@ConstantsModule'
import { aliases } from '@StylesModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} Application image placeholder styles
 */
export const getStyles = ({ theme }) => {
  const isDark = theme.palette.mode === SCHEMES.DARK
  const { primary } = aliases

  return {
    display: 'block',
    flexShrink: 0,

    '& .application-placeholder-background': {
      fill: isDark ? primary[500] : primary[900],
    },

    '& .application-placeholder-outline': {
      stroke: isDark ? primary[600] : primary[500],
    },

    '& .application-placeholder-connector': {
      stroke: isDark ? primary.default : primary[500],
    },

    '& .application-placeholder-tile': {
      fill: isDark ? primary.default : primary[500],
    },
  }
}
