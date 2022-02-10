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
import PropTypes from 'prop-types'
import { ModernTv } from 'iconoir-react'
import { Typography, Paper } from '@mui/material'

import * as Actions from 'client/components/Tabs/Vm/Storage/Actions'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import { Translate } from 'client/components/HOC'

import * as Helper from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T, VM_ACTIONS } from 'client/constants'

const StorageSubItem = ({ disk, snapshot = {}, actions = [] }) => {
  const classes = rowStyles()

  const isImage = disk?.IMAGE_ID !== undefined

  const {
    ID,
    NAME,
    ACTIVE,
    DATE,
    SIZE: SNAPSHOT_SIZE,
    MONITOR_SIZE: SNAPSHOT_MONITOR_SIZE,
  } = snapshot

  const isActive = Helper.stringToBoolean(ACTIVE)
  const time = Helper.timeFromMilliseconds(+DATE)
  const timeAgo = `created ${time.toRelative()}`

  const size = +SNAPSHOT_SIZE ? prettyBytes(+SNAPSHOT_SIZE, 'MB') : '-'
  const monitorSize = +SNAPSHOT_MONITOR_SIZE
    ? prettyBytes(+SNAPSHOT_MONITOR_SIZE, 'MB')
    : '-'

  return (
    <Paper variant="outlined" className={classes.root}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component="span">{NAME}</Typography>
          <span className={classes.labels}>
            {isActive && <StatusChip text={<Translate word={T.Active} />} />}
            <StatusChip text={<Translate word={T.Snapshot} />} />
          </span>
        </div>
        <div className={classes.caption}>
          <span title={time.toFormat('ff')}>{`#${ID} ${timeAgo}`}</span>
          <span title={`Monitor Size / Disk Size: ${monitorSize}/${size}`}>
            <ModernTv />
            <span>{` ${monitorSize}/${size}`}</span>
          </span>
        </div>
      </div>
      {!!actions.length && (
        <div className={classes.actions}>
          {actions?.includes?.(VM_ACTIONS.DISK_SAVEAS) && isImage && (
            <Actions.SaveAsAction disk={disk} snapshot={snapshot} />
          )}
          {actions?.includes?.(VM_ACTIONS.SNAPSHOT_DISK_RENAME) && (
            <Actions.SnapshotRenameAction disk={disk} snapshot={snapshot} />
          )}
          {actions?.includes?.(VM_ACTIONS.SNAPSHOT_DISK_REVERT) && (
            <Actions.SnapshotRevertAction disk={disk} snapshot={snapshot} />
          )}
          {actions?.includes?.(VM_ACTIONS.SNAPSHOT_DISK_DELETE) && (
            <Actions.SnapshotDeleteAction disk={disk} snapshot={snapshot} />
          )}
        </div>
      )}
    </Paper>
  )
}

StorageSubItem.propTypes = {
  disk: PropTypes.object.isRequired,
  snapshot: PropTypes.object.isRequired,
  actions: PropTypes.arrayOf(PropTypes.string),
}

StorageSubItem.displayName = 'StorageSubItem'

export default StorageSubItem
