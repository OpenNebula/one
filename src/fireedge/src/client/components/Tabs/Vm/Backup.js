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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { useGetVmQuery } from 'client/features/OneApi/vm'
import { BackupsTable } from 'client/components/Tables'
import { useHistory, generatePath } from 'react-router-dom'
import { PATH } from 'client/apps/sunstone/routesOne'

/**
 * Renders the list of backups from a VM.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual Machine id
 * @returns {ReactElement} Backups tab
 */
const VmBackupTab = ({ id }) => {
  const { data: vm = {} } = useGetVmQuery({ id })
  const path = PATH.STORAGE.BACKUPS.DETAIL
  const history = useHistory()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  return (
    <BackupsTable
      disableRowSelect
      disableGlobalSort
      vm={vm}
      onRowClick={(row) => handleRowClick(row.ID)}
    />
  )
}

VmBackupTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmBackupTab.displayName = 'VmBackupTab'

export default VmBackupTab
