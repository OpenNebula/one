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
import { useMemo, memo } from 'react'
import { useTheme, Typography, Paper } from '@mui/material'
import PropTypes from 'prop-types'

import { rowStyles } from '@modules/components/Tables/styles'
import * as Helper from '@ModelsModule'
import { Snapshot, T } from '@ConstantsModule'

import { Tr } from '@modules/components/HOC'

const SnapshotCard = memo(
  ({ snapshot, actions = [], extraActionProps = {} }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])

    /** @type {Snapshot} */
    const { SNAPSHOT_ID, NAME, TIME } = snapshot

    const time = Helper.timeFromMilliseconds(+TIME)
    const timeAgo = `${Tr(T.Created)} ${time.toRelative()}`

    return (
      <Paper
        variant="outlined"
        className={classes.root}
        data-cy={`snapshot-${SNAPSHOT_ID}`}
      >
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span" data-cy="snapshot-name">
              {NAME}
            </Typography>
          </div>
          <div className={classes.caption}>
            <span title={time.toFormat('ff')} data-cy="snapshot-id">
              {`#${SNAPSHOT_ID} ${timeAgo}`}
            </span>
          </div>
        </div>
        {!!actions.length && (
          <div className={classes.actions}>
            {actions.map((Action, idx) => (
              <Action
                key={`${Action.displayName ?? idx}-${SNAPSHOT_ID}`}
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

SnapshotCard.propTypes = {
  snapshot: PropTypes.object.isRequired,
  actions: PropTypes.array,
  extraActionProps: PropTypes.object,
}

SnapshotCard.displayName = 'SnapshotCard'

export default SnapshotCard
