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
import { Component, useMemo } from 'react'
import { TablePanel } from '@ComponentsV2Module'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { getVirtualRouterVms, VM_COLUMNS, vmsTable } from '@ModelsModule'

const HIDDEN_COLUMN_IDS = ['cpu', 'memory', 'disk_size']

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Virtual Router VMs tab
 */
export const Vms = ({ data }) => {
  const { vrouter = {} } = data || {}
  const vrouterVmIds = useMemo(
    () => getVirtualRouterVms(vrouter).map(String),
    [vrouter]
  )

  const { data: vms = [], isFetching } = vmsTable.useData()
  const filteredVms = useMemo(
    () => vms.filter(({ ID }) => vrouterVmIds.includes(String(ID))),
    [vms, vrouterVmIds]
  )
  const columns = useMemo(
    () => VM_COLUMNS.filter(({ id }) => !HIDDEN_COLUMN_IDS.includes(id)),
    []
  )

  return (
    <TablePanel
      title={T.VirtualMachines}
      columns={columns}
      data={filteredVms}
      isLoading={isFetching}
      isFullHeight
      openRowDetailsOnClick
      rowDetailsResourceId={RESOURCE_NAMES.VM}
    />
  )
}

Vms.propTypes = {
  data: PropTypes.object,
}

Vms.id = 'vms'
Vms.title = T.VirtualMachines
