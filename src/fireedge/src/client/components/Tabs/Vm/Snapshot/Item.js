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
import * as React from 'react'
import PropTypes from 'prop-types'

import { Trash, UndoAction } from 'iconoir-react'
import { Typography, Paper } from '@material-ui/core'

// import { useVmApi } from 'client/features/One'
import { Action } from 'client/components/Cards/SelectCard'
import { rowStyles } from 'client/components/Tables/styles'

import * as Helper from 'client/models/Helper'
import { VM_ACTIONS } from 'client/constants'

const SnapshotItem = ({ snapshot, actions = [] }) => {
  const classes = rowStyles()

  const { SNAPSHOT_ID, NAME, TIME } = snapshot

  const time = Helper.timeFromMilliseconds(+TIME)
  const timeAgo = `created ${time.toRelative()}`

  return (
    <Paper variant='outlined' className={classes.root}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component='span'>
            {NAME}
          </Typography>
        </div>
        <div className={classes.caption}>
          <span title={time.toFormat('ff')}>
            {`#${SNAPSHOT_ID} ${timeAgo}`}
          </span>
        </div>
      </div>
      {!!actions.length && (
        <div className={classes.actions}>
          {actions?.includes?.(VM_ACTIONS.SNAPSHOT_REVERT) && (
            <Action
              cy={`${VM_ACTIONS.SNAPSHOT_REVERT}-${SNAPSHOT_ID}`}
              icon={<UndoAction size={18} />}
              handleClick={() => undefined}
            />
          )}
          {actions?.includes?.(VM_ACTIONS.SNAPSHOT_DELETE) && (
            <Action
              cy={`${VM_ACTIONS.SNAPSHOT_DELETE}-${SNAPSHOT_ID}`}
              icon={<Trash size={18} />}
              handleClick={() => undefined}
            />
          )}
        </div>
      )}
    </Paper>
  )
}

SnapshotItem.propTypes = {
  snapshot: PropTypes.object.isRequired,
  actions: PropTypes.arrayOf(PropTypes.string)
}

SnapshotItem.displayName = 'SnapshotItem'

export default SnapshotItem
