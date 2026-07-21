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
 * @returns {object} Styles for a truncatable IP tag list in the VM summary
 */
export const getIpSummaryStyles = () => ({
  width: 'fit-content',
  minWidth: 0,
  maxWidth: '100%',
  '& > .MuiBox-root': {
    display: 'flex',
    width: 'fit-content',
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    '& > .MuiButton-root': {
      flex: '0 1 auto',
      minWidth: 0,
    },
    '& > .MuiBox-root': {
      flex: '0 0 auto',
    },
    '& .tag-title': {
      flex: '1 1 auto',
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
})
