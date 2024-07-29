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
import { ReactElement, memo, useCallback } from 'react'
import PropTypes from 'prop-types'

import { Folder, User, Group, InfoEmpty } from 'iconoir-react'
import { Typography, Paper, Stack, Divider } from '@mui/material'

import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetGroupsQuery } from 'client/features/OneApi/group'
import { Tr, Translate } from 'client/components/HOC'
import { rowStyles } from 'client/components/Tables/styles'
import { getHistoryAction } from 'client/models/VirtualMachine'
import { timeFromMilliseconds, timeDiff } from 'client/models/Helper'
import { T, HistoryRecord } from 'client/constants'

const HistoryRecordCard = memo(
  /**
   * Renders history record card.
   *
   * @param {object} props - Props
   * @param {HistoryRecord} props.history - History
   * @returns {ReactElement} History record card component
   */
  ({ history }) => {
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
    const startTime = timeFromMilliseconds(+STIME)

    const monitorEndTime = +ETIME === 0 ? now : +ETIME
    const monitorDiffTime = timeDiff(+STIME, monitorEndTime)

    const prologEndTime = +PSTIME === 0 ? 0 : +PETIME === 0 ? now : +PETIME
    const prologDiffTime = timeDiff(+PSTIME, prologEndTime)

    const action = getHistoryAction(+ACTION)

    const getNameFromResult = useCallback(
      (id, result) => ({
        name: result?.find((item) => +item.ID === +id)?.NAME ?? '...',
      }),
      []
    )

    const { name: dsName } = useGetDatastoresQuery(undefined, {
      selectFromResult: ({ data }) => getNameFromResult(DS_ID, data),
    })

    const { name: userName } = useGetUsersQuery(undefined, {
      selectFromResult: ({ data }) => getNameFromResult(UID, data),
      skip: UID === -1,
    })

    const { name: groupName } = useGetGroupsQuery(undefined, {
      selectFromResult: ({ data }) => getNameFromResult(GID, data),
      skip: UID === -1,
    })

    return (
      <Paper
        variant="outlined"
        className={classes.root}
        data-cy={`record-${SEQ}`}
      >
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span" data-cy="record-data">
              {`${SEQ} | ${HID} ${HOSTNAME} | ${Tr(T.Action)}: ${action}`}
            </Typography>
          </div>
          <div className={classes.caption}>
            <span title={`${Tr(T.Datastore)}: ${DS_ID} ${dsName}`}>
              <Folder />
              <span data-cy="datastore">{dsName}</span>
            </span>
            {+UID !== -1 && (
              <>
                <span title={`${Tr(T.Owner)}: ${UID} ${userName}`}>
                  <User />
                  <span data-cy="owner">{userName}</span>
                </span>
                <span title={`${Tr(T.Group)}: ${GID} ${groupName}`}>
                  <Group />
                  <span data-cy="group">{groupName}</span>
                </span>
                <span title={`${Tr(T.RequestId)}: ${REQUEST_ID}`}>
                  <InfoEmpty />
                  <span data-cy="request">{REQUEST_ID}</span>
                </span>
              </>
            )}
            <Stack
              direction="row"
              component="span"
              divider={<Divider orientation="vertical" flexItem />}
            >
              <span title={Tr(T.TimeWhenTheStateChanged)}>
                <Translate
                  word={T.StartedOnTime}
                  values={[startTime.toFormat('ff')]}
                />
              </span>
              <span title={Tr(T.TotalTimeInThisState)}>
                <Translate word={T.Total} />
                {` ${monitorDiffTime}`}
              </span>
              <span title={Tr(T.PrologTimeForThisState)}>
                <Translate word={T.Prolog} />
                {` ${prologDiffTime}`}
              </span>
            </Stack>
          </div>
        </div>
      </Paper>
    )
  }
)

HistoryRecordCard.propTypes = {
  history: PropTypes.object.isRequired,
  actions: PropTypes.arrayOf(PropTypes.string),
}

HistoryRecordCard.displayName = 'HistoryRecordCard'

export default HistoryRecordCard
