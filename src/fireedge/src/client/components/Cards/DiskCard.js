/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { DatabaseSettings, Folder, PlugTypeC } from 'iconoir-react'
import { Box, Typography, Paper } from '@mui/material'

import DiskSnapshotCard from 'client/components/Cards/DiskSnapshotCard'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import { Tr } from 'client/components/HOC'

import { getDiskName, getDiskType } from 'client/models/Image'
import { stringToBoolean } from 'client/models/Helper'
import { prettyBytes, sentenceCase } from 'client/utils'
import { T, Disk, DiskSnapshot } from 'client/constants'

const DiskCard = memo(
  /**
   * @param {object} props - Props
   * @param {Disk} props.disk - Disk
   * @param {ReactElement} [props.actions] - Actions
   * @param {object} props.rootProps - Props to root component
   * @param {function({ snapshot: DiskSnapshot }):ReactElement} [props.snapshotActions] - Snapshot actions
   * @returns {ReactElement} - Card
   */
  ({ disk = {}, rootProps = {}, actions, snapshotActions }) => {
    const classes = rowStyles()

    const {
      DISK_ID,
      DATASTORE,
      TARGET,
      TYPE,
      SIZE,
      MONITOR_SIZE,
      READONLY,
      PERSISTENT,
      SAVE,
      CLONE,
      IS_CONTEXT,
      SNAPSHOTS,
    } = disk

    const size = useMemo(() => (+SIZE ? prettyBytes(+SIZE, 'MB') : '-'), [SIZE])

    const monitorSize = useMemo(
      () => (+MONITOR_SIZE ? prettyBytes(+MONITOR_SIZE, 'MB') : '-'),
      [MONITOR_SIZE]
    )

    const labels = useMemo(
      () =>
        [
          { label: getDiskType(disk), dataCy: 'type' },
          {
            label: stringToBoolean(PERSISTENT) && T.Persistent,
            dataCy: 'persistent',
          },
          {
            label: stringToBoolean(READONLY) && T.ReadOnly,
            dataCy: 'readonly',
          },
          {
            label: stringToBoolean(SAVE) && T.Save,
            dataCy: 'save',
          },
          {
            label: stringToBoolean(CLONE) && T.Clone,
            dataCy: 'clone',
          },
        ].filter(({ label } = {}) => Boolean(label)),
      [TYPE, PERSISTENT, READONLY, SAVE, CLONE]
    )

    return (
      <Paper
        variant="outlined"
        className={classes.root}
        sx={{ flexWrap: 'wrap', alignContent: 'start' }}
        data-cy={`disk-${DISK_ID}`}
        {...rootProps} // overwrites className for selection
      >
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span" data-cy="name">
              {getDiskName(disk)}
            </Typography>
            <span className={classes.labels}>
              {labels.map(({ label, dataCy }) => (
                <StatusChip
                  key={label}
                  text={sentenceCase(Tr(label))}
                  {...(dataCy && { dataCy: dataCy })}
                />
              ))}
            </span>
          </div>
          <div className={classes.caption}>
            <span>{`#${DISK_ID}`}</span>
            {TARGET && (
              <span title={`${Tr(T.TargetDevice)}: ${TARGET}`}>
                <PlugTypeC />
                <span data-cy="target">{` ${TARGET}`}</span>
              </span>
            )}
            {DATASTORE && (
              <span title={`${Tr(T.Datastore)}: ${DATASTORE}`}>
                <DatabaseSettings />
                <span data-cy="datastore">{` ${DATASTORE}`}</span>
              </span>
            )}
            {+MONITOR_SIZE ? (
              <span
                title={`${Tr(T.Monitoring)} / ${Tr(
                  T.DiskSize
                )}: ${monitorSize}/${size}`}
              >
                <Folder />
                <span data-cy="monitorsize">{` ${monitorSize}/${size}`}</span>
              </span>
            ) : (
              <span title={`${Tr(T.DiskSize)}: ${size}`}>
                <Folder />
                <span data-cy="disksize">{` ${size}`}</span>
              </span>
            )}
          </div>
        </div>
        {!IS_CONTEXT && !!actions && (
          <div className={classes.actions}>{actions}</div>
        )}
        {!!SNAPSHOTS?.length && (
          <Box flexBasis="100%">
            {SNAPSHOTS?.map((snapshot) => (
              <DiskSnapshotCard
                key={`${DISK_ID}-${snapshot.ID}`}
                snapshot={snapshot}
                actions={snapshotActions}
              />
            ))}
          </Box>
        )}
      </Paper>
    )
  }
)

DiskCard.propTypes = {
  disk: PropTypes.object.isRequired,
  actions: PropTypes.any,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  snapshotActions: PropTypes.any,
}

DiskCard.displayName = 'DiskCard'

export default DiskCard
