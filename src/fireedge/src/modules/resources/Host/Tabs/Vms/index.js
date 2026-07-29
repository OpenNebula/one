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
import { Table } from '@ComponentsV2Module'
import { vmsTable } from '@ModelsModule'
import { RESOURCE_NAMES, T } from '@ConstantsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Host API data
 * @returns {Component} Host VMs tab
 */
export const HostVmsTab = ({ data }) => {
  const { host, vms } = data

  const vmData = [].concat(vms).filter((vm) => {
    // this filters data for host
    if (host?.ID) {
      if (
        host?.ERROR_VMS?.ID ||
        host?.UPDATED_VMS?.ID ||
        host?.UPDATING_VMS?.ID
      ) {
        return [
          host?.ERROR_VMS.ID ?? [],
          host?.UPDATED_VMS.ID ?? [],
          host?.UPDATING_VMS.ID ?? [],
        ]
          .flat()
          .includes(vm.ID)
      }

      return [host?.VMS?.ID ?? []].flat().includes(vm.ID)
    }

    // This is for return data without filters
    return true
  })

  // Delete some columns to make the table simple
  const columns = useMemo(
    () =>
      vmsTable
        .columns()
        .filter(
          ({ id }) =>
            ![
              'type',
              'labels',
              'hostname',
              'vmhostname',
              'locked',
              'ips',
              'console',
            ].includes(id)
        ),
    []
  )

  return (
    <Table
      columns={columns}
      data={[].concat(vmData)}
      isRowsSelectable={false}
      openRowDetailsOnClick
      rowDetailsResourceId={RESOURCE_NAMES.VM}
    />
  )
}

HostVmsTab.propTypes = {
  data: PropTypes.object,
  tabProps: PropTypes.object,
  host: PropTypes.object,
  vms: PropTypes.array,
}

HostVmsTab.displayName = 'HostVmsTab'
HostVmsTab.id = 'vms'
HostVmsTab.title = T.VmsTab
