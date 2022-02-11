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
import { Typography, Paper } from '@mui/material'

import { rowStyles } from 'client/components/Tables/styles'
import * as Helper from 'client/models/Helper'
import { Snapshot } from 'client/constants'

const SnapshotCard = memo(
  ({ snapshot, actions = [], extraActionProps = {} }) => {
    const classes = rowStyles()

    /** @type {Snapshot} */
    const { SNAPSHOT_ID, NAME, TIME } = snapshot

    const time = Helper.timeFromMilliseconds(+TIME)
    const timeAgo = `created ${time.toRelative()}`

    return (
      <Paper variant="outlined" className={classes.root}>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography component="span">{NAME}</Typography>
          </div>
          <div className={classes.caption}>
            <span title={time.toFormat('ff')}>
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
