import * as React from 'react'
import { StatusBadge } from 'client/components/Status'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'

const VmInfoTab = data => {
  const { ID, NAME, UNAME, GNAME, RESCHED, STIME, ETIME, LOCK, DEPLOY_ID } = data

  const { name: stateName, color: stateColor } = VirtualMachine.getState(data)

  const { HID: hostId, HOSTNAME: hostname = '--', CID: clusterId } = VirtualMachine.getLastHistory(data)
  const clusterName = clusterId === '-1' ? 'default' : '--' // TODO: get from cluster list

  const ips = VirtualMachine.getIps(data)

  return (
    <div>
      <p>
        <StatusBadge
          title={stateName}
          stateColor={stateColor}
          customTransform='translate(150%, 50%)'
        />
        <span style={{ marginLeft: 20 }}>
          {`#${ID} - ${NAME}`}
        </span>
      </p>
      <div>
        <p>Owner: {UNAME}</p>
        <p>Group: {GNAME}</p>
        <p>Reschedule: {Helper.booleanToString(+RESCHED)}</p>
        <p>Locked: {Helper.levelLockToString(LOCK?.LOCKED)}</p>
        <p>IP: {ips.join(', ') || '--'}</p>
        <p>Start time: {Helper.timeToString(STIME)}</p>
        <p>End time: {Helper.timeToString(ETIME)}</p>
        <p>Host: {hostId ? `#${hostId} ${hostname}` : ''}</p>
        <p>Cluster: {clusterId ? `#${clusterId} ${clusterName}` : ''}</p>
        <p>Deploy ID: {DEPLOY_ID}</p>
      </div>
    </div>
  )
}

VmInfoTab.displayName = 'VmInfoTab'

export default VmInfoTab
