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

import { GroupAPI } from '@FeaturesModule'
import { OpenNebulaLogo } from '@modules/resources/Icons'
import { Stack } from '@mui/material'
import { AlertNotification } from '@ComponentsV2Module'
import PropTypes from 'prop-types'

/**
 * @param {object} root0 - Params
 * @param {string|number} root0.groupId - Group ID
 * @param {object} root0.selected - Selected group
 * @returns {string} Group ID
 */
export const getGroupId = ({ groupId, selected } = {}) =>
  String(groupId ?? selected?.ID ?? '')

/**
 * @param {object} root0 - Params
 * @param {string} root0.id - Group ID
 * @param {Function} root0.children - Render function
 * @returns {object} Guarded legacy group tab
 */
export const LegacyGroupTab = ({ id, children }) => {
  const { isError, error, status, data } = GroupAPI.useGetGroupQuery({ id })

  if (isError) {
    return (
      <AlertNotification
        type="primary"
        status="error"
        description={error?.data}
        isDismissible={false}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
    )
  }

  if (status === 'fulfilled' || String(id) === String(data?.ID)) {
    return children()
  }

  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <OpenNebulaLogo width={150} height={150} spinner />
    </Stack>
  )
}

LegacyGroupTab.propTypes = {
  id: PropTypes.string,
  children: PropTypes.func,
}

export const groupTabPropTypes = {
  data: PropTypes.shape({
    groupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selected: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  }),
  config: PropTypes.object,
}
