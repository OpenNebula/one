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

import PropTypes from 'prop-types'

/**
 * @param {object} root0 - Params
 * @param {string|number} root0.groupId - Group ID
 * @param {object} root0.selected - Selected group
 * @returns {string} Group ID
 */
export const getGroupId = ({ groupId, selected } = {}) =>
  String(groupId ?? selected?.ID ?? '')

export const groupTabPropTypes = {
  data: PropTypes.shape({
    groupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selected: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  }),
  config: PropTypes.object,
}
