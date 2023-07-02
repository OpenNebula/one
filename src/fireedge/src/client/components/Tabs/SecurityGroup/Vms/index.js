/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { PATH } from 'client/apps/sunstone/routesOne'
import { VmsTable } from 'client/components/Tables'
import EmptyTab from 'client/components/Tabs/EmptyTab'
import { T } from 'client/constants'
import { useGetSecGroupQuery } from 'client/features/OneApi/securityGroup'
import { CloudDesync, WarningTriangleOutline } from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

/**
 * Renders mainly Vms tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Image id
 * @returns {ReactElement} vms tab
 */
const VmsTab = ({ id }) => {
  const { data: secGroup = {} } = useGetSecGroupQuery({ id })
  const path = PATH.INSTANCE.VMS.DETAIL
  const history = useHistory()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  return (
    <VmsTable
      disableGlobalSort
      displaySelectedRows
      host={secGroup}
      messages={[
        {
          rows: [secGroup?.ERROR_VMS.ID ?? []].flat(),
          message: T.ErrorUpdatingSecGroups,
          icon: <WarningTriangleOutline />,
          type: 'error',
        },
        {
          rows: [secGroup?.UPDATING_VMS.ID ?? []].flat(),
          message: T.PendingUpdatingSecGroups,
          icon: <CloudDesync />,
          type: 'info',
        },
      ]}
      onRowClick={(row) => handleRowClick(row.ID)}
      noDataMessage={<EmptyTab label={T.NotVmsCurrentySecGroups} />}
    />
  )
}

VmsTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmsTab.displayName = 'VmsTab'

export default VmsTab
