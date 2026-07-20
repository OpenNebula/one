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
 * @returns {object} - Slider SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  width: `100%`,
  height: `${theme.scale[200]}px`,
  alignItems: 'center',
  borderRadius: `${theme.borderRadius.round}px`,
  padding: 0,
  // color: theme.palette.primary.default,
  '& .MuiSlider-rail': {
    height: `${theme.scale[200]}px`,
    borderRadius: `${theme.borderRadius.round}px`,
    backgroundColor: theme.palette.surface.disabled,
    opacity: 1,
  },

  '& .MuiSlider-track': {
    height: `${theme.scale[200]}px`,
    borderRadius: `${theme.borderRadius.round}px`,
    backgroundColor: theme.palette.primary.default,
    border: 'none',
  },

  '& .MuiSlider-thumb': {
    width: `${theme.scale[550]}px`,
    height: `${theme.scale[550]}px`,
    backgroundColor: theme.palette.surface.primary,
    border: `${theme.borderWidth.md}px solid ${theme.palette.primary.default}`,
    boxShadow: 'none',
  },

  '& .MuiSlider-thumb.Mui-focusVisible, & .MuiSlider-thumb.Mui-active, & .MuiSlider-thumb:hover':
    {
      boxShadow: 'none',
    },
})
