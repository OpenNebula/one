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
 * @returns {object} - Host PCI tab SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 3fr)',
  gap: `${theme.scale[200]}px`,
  height: '100%',

  '& .pci-profile-selector': {
    paddingRight: `${theme.scale[200]}px`,
    borderRight: `${theme.borderWidth.sm}px solid ${theme.palette.divider}`,
    height: '100%',
    minWidth: 0,
  },

  '& .pci-tables': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[600]}px`,
    minWidth: 0,
  },

  '& .partition-addresses': {
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
  },
})
