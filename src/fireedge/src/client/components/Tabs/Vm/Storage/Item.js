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
import * as React from 'react'
import PropTypes from 'prop-types'

import {
  DatabaseSettings, Folder, ModernTv,
  Trash, SaveActionFloppy, Camera, Expand
} from 'iconoir-react'
import { Typography } from '@material-ui/core'

// import { useVmApi } from 'client/features/One'
import { Action } from 'client/components/Cards/SelectCard'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as Helper from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { VM_ACTIONS } from 'client/constants'

const StorageItem = ({ disk, actions = [] }) => {
  const classes = rowStyles()

  const {
    DISK_ID,
    DATASTORE,
    TARGET,
    IMAGE,
    TYPE,
    FORMAT,
    SIZE,
    MONITOR_SIZE,
    READONLY,
    PERSISTENT,
    SAVE,
    CLONE,
    IS_CONTEXT
  } = disk

  const size = +SIZE ? prettyBytes(+SIZE, 'MB') : '-'
  const monitorSize = +MONITOR_SIZE ? prettyBytes(+MONITOR_SIZE, 'MB') : '-'

  const type = String(TYPE).toLowerCase()

  const image = IMAGE ?? ({
    fs: `${FORMAT} - ${size}`,
    swap: size
  }[type])

  const labels = [...new Set([
    TYPE,
    Helper.stringToBoolean(PERSISTENT) && 'PERSISTENT',
    Helper.stringToBoolean(READONLY) && 'READONLY',
    Helper.stringToBoolean(SAVE) && 'SAVE',
    Helper.stringToBoolean(CLONE) && 'CLONE'
  ])].filter(Boolean)

  return (
    <div className={classes.root}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component='span'>
            {image}
          </Typography>
          <span className={classes.labels}>
            {labels.map(label => (
              <StatusChip key={label} text={label} />
            ))}
          </span>
        </div>
        <div className={classes.caption}>
          <span>
            {`#${DISK_ID}`}
          </span>
          {TARGET && (
            <span title={`Target: ${TARGET}`}>
              <DatabaseSettings size={16} />
              <span>{` ${TARGET}`}</span>
            </span>
          )}
          {DATASTORE && (
            <span title={`Datastore Name: ${DATASTORE}`}>
              <Folder size={16} />
              <span>{` ${DATASTORE}`}</span>
            </span>
          )}
          <span title={`Monitor Size / Disk Size: ${monitorSize}/${size}`}>
            <ModernTv size={16} />
            <span>{` ${monitorSize}/${size}`}</span>
          </span>
        </div>
      </div>
      {!IS_CONTEXT && !!actions.length && (
        <div className={classes.actions}>
          {actions.includes(VM_ACTIONS.DISK_SAVEAS) && (
            <Action
              cy={`${VM_ACTIONS.DISK_SAVEAS}-${DISK_ID}`}
              icon={<SaveActionFloppy size={18} />}
              handleClick={() => undefined}
            />
          )}
          {actions.includes(VM_ACTIONS.SNAPSHOT_DISK_CREATE) && (
            <Action
              cy={`${VM_ACTIONS.SNAPSHOT_DISK_CREATE}-${DISK_ID}`}
              icon={<Camera size={18} />}
              handleClick={() => undefined}
            />
          )}
          {actions.includes(VM_ACTIONS.RESIZE_DISK) && (
            <Action
              cy={`${VM_ACTIONS.RESIZE_DISK}-${DISK_ID}`}
              icon={<Expand size={18} />}
              handleClick={() => undefined}
            />
          )}
          {actions.includes(VM_ACTIONS.DETACH_DISK) && (
            <Action
              cy={`${VM_ACTIONS.DETACH_DISK}-${DISK_ID}`}
              icon={<Trash size={18} />}
              handleClick={() => undefined}
            />
          )}
        </div>
      )}
    </div>
  )
}

StorageItem.propTypes = {
  disk: PropTypes.object.isRequired,
  actions: PropTypes.arrayOf(PropTypes.string)
}

StorageItem.displayName = 'StorageItem'

export default StorageItem
