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
 * @param {object} theme - Current theme
 * @returns {object} Alert wrapper styles
 */
export const alertWrapperStyles = (theme) => ({
  width: '100%',
  '& .vn-template-alert': {
    width: '100%',
    minWidth: 0,
    padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
  },
  '& .vn-template-alert .alert-content': {
    alignItems: 'center',
    alignContent: 'center',
    flexWrap: 'nowrap',
    gap: `${theme.scale[300]}px`,
    minWidth: 0,
  },
  '& .vn-template-alert .status-icon': {
    flex: '0 0 auto',
    alignSelf: 'center',
  },
  '& .vn-template-alert .text-content': {
    justifyContent: 'center',
    gap: 0,
    minWidth: 0,
  },
  '& .vn-template-alert .alert-description': {
    display: 'flex',
    alignItems: 'center',
  },
})
