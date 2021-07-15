/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import * as React from 'react'
import PropTypes from 'prop-types'

import { StatusChip } from 'client/components/Status'
import { List } from 'client/components/Tabs/Common'
import Multiple from 'client/components/Tables/Vms/multiple'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { T, VM_ACTIONS } from 'client/constants'

const InformationPanel = ({ vm = {}, handleRename, actions }) => {
  const { ID, NAME, RESCHED, STIME, ETIME, LOCK, DEPLOY_ID } = vm

  const { name: stateName, color: stateColor } = VirtualMachine.getState(vm)

  const { HID: hostId, HOSTNAME: hostname = '--', CID: clusterId } = VirtualMachine.getLastHistory(vm)
  const clusterName = clusterId === '-1' ? 'default' : '--' // TODO: get from cluster list

  const ips = VirtualMachine.getIps(vm)

  const info = [
    { name: T.ID, value: ID },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(VM_ACTIONS.RENAME),
      handleEdit: handleRename
    },
    {
      name: T.State,
      value: <StatusChip text={stateName} stateColor={stateColor} />
    },
    {
      name: T.Reschedule,
      value: Helper.booleanToString(+RESCHED)
    },
    {
      name: T.Locked,
      value: Helper.levelLockToString(LOCK?.LOCKED)
    },
    {
      name: T.IP,
      value: ips?.length ? <Multiple tags={ips} /> : '--'
    },
    {
      name: T.StartTime,
      value: Helper.timeToString(STIME)
    },
    {
      name: T.EndTime,
      value: Helper.timeToString(ETIME)
    },
    {
      name: T.Host,
      value: hostId ? `#${hostId} ${hostname}` : ''
    },
    {
      name: T.Cluster,
      value: clusterId ? `#${clusterId} ${clusterName}` : ''
    },
    {
      name: T.DeployID,
      value: DEPLOY_ID
    }
  ]

  return (
    <List title={T.Information} list={info} style={{ gridRow: 'span 3' }} />
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  handleRename: PropTypes.func,
  vm: PropTypes.object
}

export default InformationPanel
