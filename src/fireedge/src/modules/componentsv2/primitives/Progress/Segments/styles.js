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
import { getBarHeight } from '@modules/componentsv2/primitives/Progress/Bar/styles'

const segmentToneStyles = {
  neutral: 'icon.disabled',
  success: 'icon.success',
  warning: 'icon.warning',
  error: 'icon.error',
  information: 'icon.information',
  action: 'icon.action',
  focus: 'icon.focus',
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {'extraSmall'|'small'|'medium'|'large'} root0.size - Bar size
 * @returns {object} Segmented progress bar SX styles
 */
export const getStyles = ({ theme, size }) => ({
  display: 'flex',
  width: '100%',
  height: getBarHeight(theme, size),
  minWidth: 0,
  overflow: 'hidden',
  gap: `${theme.scale[50]}px`,
  borderRadius: `${theme.borderRadius.round}px`,

  '& .progress-bar-segments-segment, & .progress-bar-segments-remainder': {
    minWidth: 0,
    flexBasis: 0,
    borderRadius: `${theme.borderRadius.round}px`,
  },

  '& .progress-bar-segments-remainder': {
    bgcolor: 'surface.disabled2',
  },

  ...Object.fromEntries(
    Object.entries(segmentToneStyles).map(([tone, color]) => [
      `& .progress-bar-segments-tone-${tone}`,
      { bgcolor: color },
    ])
  ),
})
