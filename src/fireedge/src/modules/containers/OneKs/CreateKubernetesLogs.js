/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useEffect, useState, useMemo } from 'react'
import { Redirect, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from '@ProvidersModule'
import {
  SkeletonStepsForm,
  SubmitButton,
  LogsViewer,
  ProgressBar,
  StatusTag,
  Text,
} from '@ComponentsV2Module'
import { Box, Stack } from '@mui/material'
import { OneKsAPI } from '@FeaturesModule'
import {
  T,
  ONEKS_OPERATIONS,
  PATH,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
} from '@ConstantsModule'
import { last, filter, find } from 'lodash'
import { getOneKsProgress, getVirtualOneKsState } from '@ModelsModule'
import { useHistory } from 'react-router'

/**
 * Displays the creation form for a cluster.
 *
 * @returns {ReactElement} - The Kubernetes logs component
 */
export function CreateKubernetesLogs() {
  const { translate } = useTranslation()
  // Get history to redirect to back to clusters
  const history = useHistory()

  // Get id and the name of the operation
  const { id } = useParams()
  const { state } = useLocation()

  if (Number.isNaN(+id)) {
    return <Redirect to="/" />
  }

  const operationText = find(ONEKS_OPERATIONS, {
    name: state?.operation,
  })?.text

  const [recover] = OneKsAPI.useRecoverOneKsClusterMutation()

  // Get provision
  const { data: kubernetes } = OneKsAPI.useGetOneKsClusterQuery(
    { id: id },
    {
      pollingInterval: 3000,
      skipPollingIfUnfocused: true,
    }
  )
  const document = kubernetes?.DOCUMENT

  // Handle progress in the progress bar
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const nextProgress = getOneKsProgress(
      document?.TEMPLATE?.CLUSTER_BODY?.state
    )

    // Only update if it's a valid number
    if (typeof nextProgress === 'number') {
      setProgress(nextProgress)
    }
    // if undefined → do nothing → bar stays where it is
  }, [kubernetes])

  // Get logs
  const { data: logsData, refetch: refetchLogs } =
    OneKsAPI.useGetKubernetesLogsQuery(
      { id: id },
      {
        pollingInterval: 3000,
        skipPollingIfUnfocused: true,
      }
    )

  // Get last info from logs to display to the user
  const lastInfo = useMemo(
    () => (logs) => {
      // Get message
      const log = last(filter(logs?.lines, { level: 'info' }))

      // Delete date and level
      const regexDate = /^(.+?\[\w\])\s*(.*)/
      const matchDate = log?.text.match(regexDate)
      const message = matchDate ? matchDate[2] : log?.text

      return message
    },
    [logsData]
  )
  const [stateColor, stateName, isFinalState] = useMemo(() => {
    const { color, name, finalState } = getVirtualOneKsState(document)

    return [color, name, finalState]
  }, [kubernetes])

  // Translations
  const translations = {
    description: translate(T['oneks.logs.create.logs']),
    operation: translate(T[operationText], [document?.NAME]),
  }

  return logsData ? (
    <>
      <Stack
        direction="column"
        sx={{ flex: '1 1 auto', minHeight: 0, minWidth: 0 }}
      >
        <Text
          variant={TEXT_VARIANTS.BODY_SMALL}
          value={translations.description}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ marginTop: '10px' }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <Text
              variant={TEXT_VARIANTS.BODY_SMALL}
              weight={TEXT_WEIGHTS.SEMIBOLD}
              value={operationText ? translations.operation : document?.NAME}
            />
            <StatusTag
              dataCy="state"
              statusColor={stateColor}
              statusName={stateName}
            />
          </Stack>
          <SubmitButton
            data-cy={`button-background`}
            size="medium"
            type="primary"
            onClick={() => history.push(PATH.ONEKS.LIST)}
            label={isFinalState ? T.Close : T.RunBackground}
          />
        </Stack>
        <Stack
          direction="column"
          sx={{ width: '100%', margin: '15px 0', gap: '4px' }}
        >
          {progress < 100 && (
            <Text
              variant={TEXT_VARIANTS.BODY_SMALL}
              weight={TEXT_WEIGHTS.SEMIBOLD}
              value={lastInfo(logsData)}
              sx={{ color: 'text.action' }}
            />
          )}
          <ProgressBar value={progress} />
        </Stack>
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 0',
            minHeight: 0,
            minWidth: 0,
            '& > *': {
              flex: '1 1 0',
              minHeight: 0,
              minWidth: 0,
            },
          }}
        >
          <LogsViewer
            logs={logsData}
            getLogs={refetchLogs}
            options={{ followLogs: true }}
            onRetry={() => recover({ id })}
            messageSuccessRetry={T.SuccessOneKsRetried}
            messageErrorRetry={T.ErrorOneKsRetried}
          />
        </Box>
      </Stack>
    </>
  ) : (
    <SkeletonStepsForm />
  )
}
