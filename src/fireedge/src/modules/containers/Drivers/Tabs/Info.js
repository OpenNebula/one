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

import { DetailsCard, StatusTag } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { getDriverState } from '@ModelsModule'
import PropTypes from 'prop-types'

/**
 * Displays the driver information tab.
 *
 * @param {object} root0 - Component props
 * @param {object} root0.data - Tab data
 * @returns {object} Driver information
 */
export const Info = ({ data }) => {
  const { selected = {} } = data ?? {}
  const { name, description, state } = selected
  const status = getDriverState(selected) ?? {}

  return (
    <DetailsCard
      title={T.Information}
      options={[
        [T.Name, name ?? '-'],
        [T.Description, description ?? '-'],
        [
          T.State,
          <StatusTag
            key="state"
            statusColor={status.color}
            statusName={status.name ?? state}
          />,
        ],
      ]}
    />
  )
}

Info.propTypes = {
  data: PropTypes.object,
}

Info.id = 'info'
Info.title = T.Information
