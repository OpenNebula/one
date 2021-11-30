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
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { generatePath } from 'react-router-dom'

import { useCluster, useClusterApi } from 'client/features/One'
import { StatusChip } from 'client/components/Status'
import { List } from 'client/components/Tabs/Common'
import MultipleTags from 'client/components/MultipleTags'

import { getState, getLastHistory, getIps } from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { T, VM_ACTIONS } from 'client/constants'
import { PATH } from 'client/apps/sunstone/routesOne'

const InformationPanel = ({ vm = {}, handleRename, actions }) => {
  const clusters = useCluster()
  const { getCluster } = useClusterApi()

  const { ID, NAME, RESCHED, STIME, ETIME, LOCK, DEPLOY_ID } = vm
  const { name: stateName, color: stateColor } = getState(vm)
  const {
    HID: hostId,
    HOSTNAME: hostname = '--',
    CID: clusterId,
  } = getLastHistory(vm)
  const ips = getIps(vm)

  const [clusterName, setClusterName] = useState(() =>
    clusterId === '-1'
      ? 'default'
      : clusters.find((c) => c.ID === clusterId)?.NAME
  )

  useEffect(() => {
    const loadCluster = async () => {
      const cluster = await getCluster(clusterId)
      cluster?.NAME && setClusterName(cluster.NAME)
    }

    !clusterName && loadCluster()
  }, [])

  const info = [
    { name: T.ID, value: ID },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(VM_ACTIONS.RENAME),
      handleEdit: handleRename,
    },
    {
      name: T.State,
      value: <StatusChip text={stateName} stateColor={stateColor} />,
    },
    {
      name: T.Reschedule,
      value: Helper.booleanToString(+RESCHED),
    },
    {
      name: T.Locked,
      value: Helper.levelLockToString(LOCK?.LOCKED),
    },
    {
      name: T.IP,
      value: ips?.length ? <MultipleTags tags={ips} /> : '--',
    },
    {
      name: T.StartTime,
      value: Helper.timeToString(STIME),
    },
    {
      name: T.EndTime,
      value: Helper.timeToString(ETIME),
    },
    hostId && {
      name: T.Host,
      value: `#${hostId} ${hostname}`,
      link:
        !Number.isNaN(+hostId) &&
        generatePath(PATH.INFRASTRUCTURE.HOSTS.DETAIL, { id: hostId }),
    },
    clusterId && {
      name: T.Cluster,
      value: clusterName ? `#${clusterId} ${clusterName}` : `#${clusterId} --`,
      link:
        !Number.isNaN(+clusterId) &&
        generatePath(PATH.INFRASTRUCTURE.CLUSTERS.DETAIL, { id: clusterId }),
    },
    {
      name: T.DeployID,
      value: DEPLOY_ID,
    },
  ].filter(Boolean)

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ style: { gridRow: 'span 3' } }}
    />
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  handleRename: PropTypes.func,
  vm: PropTypes.object,
}

export default InformationPanel
