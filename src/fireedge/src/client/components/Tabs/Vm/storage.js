import * as React from 'react'

import * as VirtualMachine from 'client/models/VirtualMachine'
import { prettyBytes } from 'client/utils'

const VmStorageTab = data => {
  const disks = VirtualMachine.getDisks(data)

  return (
    <div>
      <p>VM DISKS</p>
      {disks.map(({
        DISK_ID,
        DATASTORE = '-',
        TARGET = '-',
        IMAGE,
        TYPE,
        FORMAT,
        SIZE,
        MONITOR_SIZE,
        READONLY,
        SAVE = 'No',
        CLONE
      }) => {
        const size = +SIZE ? prettyBytes(+SIZE, 'MB') : '-'
        const monitorSize = +MONITOR_SIZE ? prettyBytes(+MONITOR_SIZE, 'MB') : '-'

        const type = String(TYPE).toLowerCase()

        const image = IMAGE ?? ({
          fs: `${FORMAT} - ${size}`,
          swap: size
        }[type])

        return (
          <p key={DISK_ID}>
            {`${DISK_ID} |
              ${DATASTORE} |
              ${TARGET} |
              ${image} |
              ${monitorSize}/${size} |
              ${type} |
              ${READONLY} |
              ${SAVE} |
              ${CLONE}`}
          </p>
        )
      })}
    </div>
  )
}

VmStorageTab.displayName = 'VmStorageTab'

export default VmStorageTab
