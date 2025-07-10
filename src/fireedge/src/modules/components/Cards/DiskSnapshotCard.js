/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, memo, useMemo } from 'react'
import { useTheme, Typography, Paper } from '@mui/material'
import PropTypes from 'prop-types'
import { ModernTv } from 'iconoir-react'

import { StatusChip } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import { Tr, Translate } from '@modules/components/HOC'

import { stringToBoolean, timeFromMilliseconds } from '@ModelsModule'
import { prettyBytes } from '@UtilsModule'
import { T, DiskSnapshot } from '@ConstantsModule'

const DiskSnapshotCard = memo(
  /**
   * @param {object} props - Props
   * @param {DiskSnapshot} props.snapshot - Disk snapshot
   * @param {function({ snapshot: DiskSnapshot }):ReactElement} [props.actions] - Actions
   * @returns {ReactElement} - Card
   */
  ({ snapshot = {}, actions }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])

    const {
      ID,
      NAME,
      ACTIVE,
      DATE,
      SIZE: SNAPSHOT_SIZE,
      MONITOR_SIZE: SNAPSHOT_MONITOR_SIZE,
    } = snapshot

    const isActive = useMemo(() => stringToBoolean(ACTIVE), [ACTIVE])
    const time = useMemo(() => timeFromMilliseconds(+DATE), [DATE])
    const timeFormat = useMemo(() => time.toFormat('ff'), [DATE])
    const timeAgo = useMemo(() => `created ${time.toRelative()}`, [DATE])

    const sizeInfo = useMemo(() => {
      const size = +SNAPSHOT_SIZE ? prettyBytes(+SNAPSHOT_SIZE, 'MB') : '-'
      const monitorSize = +SNAPSHOT_MONITOR_SIZE
        ? prettyBytes(+SNAPSHOT_MONITOR_SIZE, 'MB')
        : '-'

      return `${monitorSize}/${size}`
    }, [SNAPSHOT_SIZE, SNAPSHOT_MONITOR_SIZE])

    return (
      <Paper
        variant="outlined"
        className={classes.root}
        data-cy={`disksnapshot-${ID}`}
      >
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span" data-cy="disksnapshot-name">
              {NAME}
            </Typography>
            <span className={classes.labels}>
              {isActive && <StatusChip text={<Translate word={T.Active} />} />}
              <StatusChip text={<Translate word={T.Snapshot} />} />
            </span>
          </div>
          <div className={classes.caption}>
            <span title={timeFormat}>{`#${ID} ${timeAgo}`}</span>
            <span
              title={`${Tr(T.Monitoring)} / ${Tr(T.DiskSize)}: ${sizeInfo}`}
            >
              <ModernTv />
              <span>{` ${sizeInfo}`}</span>
            </span>
          </div>
        </div>
        {typeof actions === 'function' && (
          <div className={classes.actions}>{actions({ snapshot })}</div>
        )}
      </Paper>
    )
  }
)

DiskSnapshotCard.propTypes = {
  snapshot: PropTypes.object.isRequired,
  actions: PropTypes.func,
}

DiskSnapshotCard.displayName = 'DiskSnapshotCard'

export default DiskSnapshotCard
