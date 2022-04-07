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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { DatabaseSettings, Folder, ModernTv } from 'iconoir-react'
import { Box, Typography, Paper } from '@mui/material'

import DiskSnapshotCard from 'client/components/Cards/DiskSnapshotCard'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import { Tr } from 'client/components/HOC'

import { getDiskName, getDiskType } from 'client/models/Image'
import { stringToBoolean } from 'client/models/Helper'
import { prettyBytes, sentenceCase } from 'client/utils'
import { T, Disk } from 'client/constants'

const DiskCard = memo(({ disk = {}, actions = [], snapshotActions = [] }) => {
  const classes = rowStyles()

  /** @type {Disk} */
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

  const size = +SIZE ? prettyBytes(+SIZE, 'MB') : '-'
  const monitorSize = +MONITOR_SIZE ? prettyBytes(+MONITOR_SIZE, 'MB') : '-'

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
      sx={{ flexWrap: 'wrap' }}
      data-cy={`disk-${DISK_ID}`}
    >
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component="span" data-cy="name">
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
            <span title={`Target: ${TARGET}`}>
              <DatabaseSettings />
              <span data-cy="target">{` ${TARGET}`}</span>
            </span>
          )}
          {DATASTORE && (
            <span title={`Datastore Name: ${DATASTORE}`}>
              <Folder />
              <span data-cy="datastore">{` ${DATASTORE}`}</span>
            </span>
          )}
          {+MONITOR_SIZE ? (
            <span title={`Monitor Size / Disk Size: ${monitorSize}/${size}`}>
              <ModernTv />
              <span data-cy="monitorsize">{` ${monitorSize}/${size}`}</span>
            </span>
          ) : (
            <span title={`Disk Size: ${size}`}>
              <ModernTv />
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
})

DiskCard.propTypes = {
  disk: PropTypes.object.isRequired,
  actions: PropTypes.any,
  extraActionProps: PropTypes.object,
  extraSnapshotActionProps: PropTypes.object,
  snapshotActions: PropTypes.any,
}

DiskCard.displayName = 'DiskCard'

export default DiskCard
