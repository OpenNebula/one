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
import { ReactElement, useMemo } from 'react'
import { Table } from '@ComponentsV2Module'
import { RESOURCE_NAMES, T, VM_EXTENDED_POOL } from '@ConstantsModule'
import { vmsTable } from '@ModelsModule'

const HIDDEN_COLUMN_IDS = [
  'type',
  'labels',
  'hostname',
  'vmhostname',
  'locked',
  'ips',
  'console',
]

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {ReactElement} - Image VMs tab
 */
export const VMs = ({ data }) => {
  const image = [].concat(data?.selected).filter(Boolean)?.[0] ?? {}

  const { data: vmData = [] } = vmsTable.useData(
    { extended: VM_EXTENDED_POOL ? 1 : 0 },
    {
      selectFromResult: (result) => ({
        ...result,
        data: result?.data?.filter((vm) => {
          if (!image?.ID) {
            return true
          }

          const imageVmIds = [
            image?.ERROR_VMS?.ID ?? [],
            image?.UPDATED_VMS?.ID ?? [],
            image?.UPDATING_VMS?.ID ?? [],
            image?.VMS?.ID ?? [],
          ]
            .flat()
            .map(String)

          return imageVmIds.includes(String(vm.ID))
        }),
      }),
    }
  )

  const columns = useMemo(
    () =>
      vmsTable.columns().filter(({ id }) => !HIDDEN_COLUMN_IDS.includes(id)),
    []
  )

  return (
    <Table
      columns={columns}
      data={[].concat(vmData)}
      isRowsSelectable={false}
      isEnableSearchBar={true}
      isEnableSort={true}
      isEnableFilters={true}
      size="medium"
      openRowDetailsOnClick
      rowDetailsResourceId={RESOURCE_NAMES.VM}
    />
  )
}

VMs.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

VMs.id = 'vms'
VMs.title = T.VMs

export default VMs
