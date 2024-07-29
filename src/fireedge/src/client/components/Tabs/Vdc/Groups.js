/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { useHistory, generatePath } from 'react-router-dom'

import { PATH } from 'client/apps/sunstone/routesOne'

import { GroupsTable } from 'client/components/Tables'
import { useGetVDCQuery } from 'client/features/OneApi/vdc'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Datastore id
 * @returns {ReactElement} Information tab
 */
const GroupsInfoTab = ({ id }) => {
  const path = PATH.SYSTEM.GROUPS.DETAIL
  const history = useHistory()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const { data } = useGetVDCQuery({ id })
  const vdcGroups = data.GROUPS.ID ?? []

  return (
    <GroupsTable
      disableRowSelect
      disableGlobalSort
      vdcGroups={vdcGroups}
      onRowClick={(row) => handleRowClick(row.ID)}
    />
  )
}

GroupsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

GroupsInfoTab.displayName = 'GroupsInfoTab'

export default GroupsInfoTab
