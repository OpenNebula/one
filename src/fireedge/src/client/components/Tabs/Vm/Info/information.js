/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { generatePath } from 'react-router-dom'
import { Stack } from '@mui/material'

import { useGetClusterQuery } from 'client/features/OneApi/cluster'
import { useRenameVmMutation } from 'client/features/OneApi/vm'

import { StatusCircle, StatusChip } from 'client/components/Status'
import { List } from 'client/components/Tabs/Common'
import { Translate } from 'client/components/HOC'
import MultipleTags from 'client/components/MultipleTags'

import {
  getState,
  getLastHistory,
  getIps,
  getNicWithPortForwarding,
} from 'client/models/VirtualMachine'
import {
  booleanToString,
  levelLockToString,
  timeToString,
} from 'client/models/Helper'
import { T, VM, VM_ACTIONS } from 'client/constants'
import { PATH } from 'client/apps/sunstone/routesOne'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {VM} props.vm - Virtual machine
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ vm = {}, actions }) => {
  const [renameVm] = useRenameVmMutation()

  const { ID, NAME, RESCHED, STIME, ETIME, LOCK, DEPLOY_ID } = vm
  const { name: stateName, color: stateColor } = getState(vm)

  const ips = getIps(vm)
  const { EXTERNAL_PORT_RANGE, INTERNAL_PORT_RANGE } =
    getNicWithPortForwarding(vm) ?? {}

  const {
    HID: hostId,
    HOSTNAME: hostname = '--',
    CID: clusterId,
  } = getLastHistory(vm)

  const { data: cluster } = useGetClusterQuery({ id: clusterId })
  const clusterName = +clusterId === -1 ? 'default' : cluster?.NAME ?? '--'

  const handleRename = async (_, newName) => {
    await renameVm({ id: ID, name: newName })
  }

  const info = [
    {
      name: T.ID,
      value: ID,
      dataCy: 'id',
    },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(VM_ACTIONS.RENAME),
      handleEdit: handleRename,
      dataCy: 'name',
    },
    {
      name: T.State,
      value: (
        <Stack direction="row" alignItems="center" gap={1}>
          <StatusCircle color={stateColor} />
          <StatusChip dataCy="state" text={stateName} stateColor={stateColor} />
        </Stack>
      ),
    },
    {
      name: T.Reschedule,
      value: booleanToString(+RESCHED),
      dataCy: 'reschedule',
    },
    {
      name: T.Locked,
      value: levelLockToString(LOCK?.LOCKED),
      dataCy: 'locked',
    },
    {
      name: T.IP,
      value: ips?.length ? <MultipleTags tags={ips} clipboard /> : '--',
      dataCy: 'ips',
    },
    EXTERNAL_PORT_RANGE &&
      INTERNAL_PORT_RANGE && {
        name: T.PortForwarding,
        value: (
          <Translate
            word={T.HostnamePortsForwardedToVmPorts}
            values={[
              hostname,
              EXTERNAL_PORT_RANGE,
              INTERNAL_PORT_RANGE?.split('/')[0]?.replace('-', ':'),
            ]}
          />
        ),
        dataCy: 'port_forwarding',
      },
    {
      name: T.StartTime,
      value: timeToString(STIME),
      dataCy: 'starttime',
    },
    {
      name: T.EndTime,
      value: timeToString(ETIME),
      dataCy: 'endtime',
    },
    hostId && {
      name: T.Host,
      value: `#${hostId} ${hostname}`,
      link:
        !Number.isNaN(+hostId) &&
        generatePath(PATH.INFRASTRUCTURE.HOSTS.DETAIL, { id: hostId }),
      dataCy: 'hostid',
    },
    clusterId && {
      name: T.Cluster,
      value: `#${clusterId} ${clusterName}`,
      link:
        !Number.isNaN(+clusterId) &&
        generatePath(PATH.INFRASTRUCTURE.CLUSTERS.DETAIL, { id: clusterId }),
      dataCy: 'clusterid',
    },
    {
      name: T.DeployID,
      value: DEPLOY_ID,
      dataCy: 'deployid',
    },
  ].filter(Boolean)

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ sx: { gridRow: 'span 3' } }}
    />
  )
}

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  vm: PropTypes.object,
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
