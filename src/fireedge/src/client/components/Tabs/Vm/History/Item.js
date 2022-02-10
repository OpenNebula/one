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

import { Folder, User } from 'iconoir-react'
import { Typography, Paper } from '@mui/material'

import { rowStyles } from 'client/components/Tables/styles'
import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'

const HistoryItem = ({ history }) => {
  const classes = rowStyles()

  const {
    SEQ,
    UID,
    GID,
    REQUEST_ID,
    HOSTNAME,
    HID,
    DS_ID,
    ACTION,
    STIME,
    ETIME,
    PSTIME,
    PETIME,
  } = history

  const now = Math.round(Date.now() / 1000)

  const startTime = Helper.timeFromMilliseconds(+STIME)

  const monitorEndTime = +ETIME === 0 ? now : +ETIME
  const monitorDiffTime = Helper.timeDiff(+STIME, monitorEndTime)

  const prologEndTime = +PSTIME === 0 ? 0 : +PETIME === 0 ? now : +PETIME
  const prologDiffTime = Helper.timeDiff(+PSTIME, prologEndTime)

  const ownerInfo = `${UID} | ${GID} | ${REQUEST_ID}`

  const action = VirtualMachine.getHistoryAction(+ACTION)

  return (
    <Paper variant="outlined" className={classes.root}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component="span">
            {`#${SEQ} | #${HID} ${HOSTNAME} | Action: ${action}`}
          </Typography>
        </div>
        <div className={classes.caption}>
          <span title={`Datastore ID: ${DS_ID}`}>
            <Folder />
            <span>{` ${DS_ID}`}</span>
          </span>
          {+UID !== -1 && (
            <span title={`Owner | Group | Request ID: ${ownerInfo}`}>
              <User />
              <span>{` ${ownerInfo}`}</span>
            </span>
          )}
          <span
            title={`Time when the state changed: ${startTime.toFormat('ff')}`}
          >
            {`| start ${startTime.toRelative()}`}
          </span>
          <span title={'Total time in this state'}>
            {`| total ${monitorDiffTime}`}
          </span>
          <span title={'Prolog time for this state'}>
            {`| prolog ${prologDiffTime}`}
          </span>
        </div>
      </div>
    </Paper>
  )
}

HistoryItem.propTypes = {
  history: PropTypes.object.isRequired,
  actions: PropTypes.arrayOf(PropTypes.string),
}

HistoryItem.displayName = 'HistoryItem'

export default HistoryItem
