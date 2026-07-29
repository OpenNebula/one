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
import { Component } from 'react'
import { Table } from '@ComponentsV2Module'
import { vmsTable, getHostZombies } from '@ModelsModule'
import { RESOURCE_NAMES, T } from '@ConstantsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Host API data
 * @returns {Component} Host zombies tab
 */
export const HostZombiesTab = ({ data }) => {
  const { host, vms = [] } = data

  // Get zombies from the host
  const zombies = getHostZombies(host)

  // Get vms and filter the ones that belongs to the host
  const vmData = [].concat(vms).filter((vm) => zombies.includes(String(vm.ID)))

  // Delete some columns to make the table simple
  const columns = vmsTable
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

HostZombiesTab.propTypes = {
  data: PropTypes.object,
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

HostZombiesTab.displayName = 'HostZombiesTab'
HostZombiesTab.id = 'zombies'
HostZombiesTab.title = T.Zombies
