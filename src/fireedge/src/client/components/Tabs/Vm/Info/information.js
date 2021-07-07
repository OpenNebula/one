import * as React from 'react'

import { StatusChip } from 'client/components/Status'
import { List } from 'client/components/Tabs/Common'
import Multiple from 'client/components/Tables/Vms/multiple'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { T } from 'client/constants'

const InformationPanel = data => {
  const { ID, NAME, RESCHED, STIME, ETIME, LOCK, DEPLOY_ID } = data

  const { name: stateName, color: stateColor } = VirtualMachine.getState(data)

  const { HID: hostId, HOSTNAME: hostname = '--', CID: clusterId } = VirtualMachine.getLastHistory(data)
  const clusterName = clusterId === '-1' ? 'default' : '--' // TODO: get from cluster list

  const ips = VirtualMachine.getIps(data)

  const info = [
    { key: T.ID, value: ID },
    { key: T.Name, value: NAME },
    {
      key: T.State,
      value: <StatusChip text={stateName} stateColor={stateColor} />
    },
    {
      key: T.Reschedule,
      value: Helper.booleanToString(+RESCHED)
    },
    {
      key: T.Locked,
      value: Helper.levelLockToString(LOCK?.LOCKED)
    },
    {
      key: T.IP,
      value: ips?.length ? <Multiple tags={ips} /> : '--'
    },
    {
      key: T.StartTime,
      value: Helper.timeToString(STIME)
    },
    {
      key: T.EndTime,
      value: Helper.timeToString(ETIME)
    },
    {
      key: T.Host,
      value: hostId ? `#${hostId} ${hostname}` : ''
    },
    {
      key: T.Cluster,
      value: clusterId ? `#${clusterId} ${clusterName}` : ''
    },
    {
      key: T.DeployID,
      value: DEPLOY_ID
    }
  ]

  return (
    <List title={T.Information} list={info} style={{ gridRow: 'span 3' }} />
  )
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
