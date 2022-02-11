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
import { memo } from 'react'
import PropTypes from 'prop-types'
import { ModernTv } from 'iconoir-react'
import { Typography, Paper } from '@mui/material'

import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import { Translate } from 'client/components/HOC'

import * as Helper from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T, DiskSnapshot } from 'client/constants'

const DiskSnapshotCard = memo(
  ({ snapshot = {}, actions = [], extraActionProps = {} }) => {
    const classes = rowStyles()

    /** @type {DiskSnapshot} */
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
            {actions.map((Action, idx) => (
              <Action
                key={`${Action.displayName ?? idx}-${ID}`}
                {...extraActionProps}
                snapshot={snapshot}
              />
            ))}
          </div>
        )}
      </Paper>
    )
  }
)

DiskSnapshotCard.propTypes = {
  snapshot: PropTypes.object.isRequired,
  extraActionProps: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
}

DiskSnapshotCard.displayName = 'DiskSnapshotCard'

export default DiskSnapshotCard
