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
import { ReactElement, memo, useCallback, useMemo } from 'react'
import { useTheme, Typography, Paper, Stack, Divider } from '@mui/material'
import PropTypes from 'prop-types'

import { Folder, User, Group, InfoEmpty, ModernTv } from 'iconoir-react'

import {
  DatastoreAPI,
  UserAPI,
  GroupAPI,
  HostAPI,
  VmAPI,
} from '@FeaturesModule'
import { Tr, Translate } from '@modules/components/HOC'
import { rowStyles } from '@modules/components/Tables/styles'
import { getHistoryAction, timeFromMilliseconds, timeDiff } from '@ModelsModule'
import { T } from '@ConstantsModule'

const HistoryRecordCard = memo(
  /**
   * Renders history record card.
   *
   * @param {object} input - Input data, either HistoryRecord or row data
   * @returns {ReactElement} History record card component
   */
  (input) => {
    const { history, original } = input
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])

    const {
      SEQ,
      ID,
      UID,
      GID,
      REQUEST_ID,
      HOSTNAME,
      HID,
      HOST_ID,
      DS_ID,
      ACTION,
      OPERATION,
      TIMESTAMP,
      VM_ID,
      STIME,
      ETIME,
      PSTIME,
      PETIME,
    } = history || original

    const now = Math.round(Date.now() / 1000)
    const startTime = STIME
      ? timeFromMilliseconds(+STIME)
      : +TIMESTAMP > 0
      ? timeFromMilliseconds(+TIMESTAMP)
      : null

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

    const { name: dsName } = DatastoreAPI.useGetDatastoresQuery(undefined, {
      selectFromResult: ({ data }) => getNameFromResult(DS_ID, data),
    })

    const { name: vmName } = VmAPI.useGetVmsQuery(undefined, {
      selectFromResult: ({ data }) => getNameFromResult(VM_ID, data),
    })

    const { name: hostName } = HostAPI.useGetHostsQuery(undefined, {
      selectFromResult: ({ data }) => getNameFromResult(HID || HOST_ID, data),
    })

    const { name: userName } = UserAPI.useGetUsersQuery(undefined, {
      selectFromResult: ({ data }) => getNameFromResult(UID, data),
      skip: UID === -1,
    })

    const { name: groupName } = GroupAPI.useGetGroupsQuery(undefined, {
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
              {`${SEQ || ID || ''} | ${HID || HOST_ID} | ${
                HOSTNAME || hostName || ''
              } | ${Tr(T.Action)}: ${ACTION ? action : OPERATION}`}
            </Typography>
          </div>
          <div className={classes.caption}>
            <span title={`${Tr(T.Datastore)}: ${DS_ID} ${dsName}`}>
              <Folder />
              <span data-cy="datastore">{dsName}</span>
            </span>
            {VM_ID != null && (
              <span title={`${Tr(T.VM)}: ${VM_ID} ${vmName}`}>
                <ModernTv />
                <span data-cy="vm">{vmName}</span>
              </span>
            )}
            {+UID !== -1 && UID != null && (
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
              {startTime != null && (
                <span title={Tr(T.TimeWhenTheStateChanged)}>
                  <Translate
                    word={T.StartedOnTime}
                    values={[startTime.toFormat('ff')]}
                  />
                </span>
              )}
              {monitorDiffTime != null && (
                <span title={Tr(T.TotalTimeInThisState)}>
                  <Translate word={T.Total} />
                  {` ${monitorDiffTime}`}
                </span>
              )}

              {prologDiffTime != null && (
                <span title={Tr(T.PrologTimeForThisState)}>
                  <Translate word={T.Prolog} />
                  {` ${prologDiffTime}`}
                </span>
              )}
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
