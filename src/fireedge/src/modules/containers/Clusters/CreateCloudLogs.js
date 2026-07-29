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
import { ProvisionAPI } from '@FeaturesModule'
import {
  T,
  CLUSTER_CLOUD_OPERATIONS,
  PATH,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
} from '@ConstantsModule'
import { last, filter, find } from 'lodash'
import {
  getProvisionColorState,
  getProvisionProgress,
  isFinalState,
} from '@ModelsModule'
import { useHistory } from 'react-router'

/**
 * Displays the creation form for a cluster.
 *
 * @returns {ReactElement} - The cluster form component
 */
export function CreateClusterCloudLogs() {
  const { translate } = useTranslation()
  // Get history to redirect to back to clusters
  const history = useHistory()

  // Get id and the name of the operation
  const { id } = useParams()
  const { state } = useLocation()

  if (Number.isNaN(+id)) {
    return <Redirect to="/" />
  }

  const operationText = find(CLUSTER_CLOUD_OPERATIONS, {
    name: state?.operation,
  })?.text

  // Get provision
  const { data: provision } = ProvisionAPI.useGetProvisionQuery(
    { id: id },
    {
      pollingInterval: 3000,
      skipPollingIfUnfocused: true,
    }
  )

  // Handle progress in the progress bar
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const nextProgress = getProvisionProgress(
      provision?.TEMPLATE?.PROVISION_BODY?.state
    )

    // Only update if it's a valid number
    if (typeof nextProgress === 'number') {
      setProgress(nextProgress)
    }
    // if undefined → do nothing → bar stays where it is
  }, [provision])

  // Get logs
  const { data: logsData, refetch: refetchLogs } =
    ProvisionAPI.useGetProvisionLogsQuery(
      { id: id, all: true },
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

  // Translations
  const translations = {
    description: translate(T['cluster.create.provisioning.description']),
    operation: translate(T[operationText], [provision?.NAME]),
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
          <Text
            variant={TEXT_VARIANTS.BODY_SMALL}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={operationText ? translations.operation : provision?.NAME}
          />
          <Box>
            <StatusTag
              dataCy="state"
              statusColor={getProvisionColorState(
                provision?.TEMPLATE?.PROVISION_BODY?.state
              )}
              statusName={provision?.TEMPLATE?.PROVISION_BODY?.state}
            />
          </Box>
          <SubmitButton
            data-cy={`button-background`}
            size="medium"
            type="primary"
            onClick={() => history.push(PATH.INFRASTRUCTURE.CLUSTERS.LIST)}
            label={
              isFinalState(provision?.TEMPLATE?.PROVISION_BODY?.state)
                ? T.Close
                : T.RunBackground
            }
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
            provisionId={id}
          />
        </Box>
      </Stack>
    </>
  ) : (
    <SkeletonStepsForm />
  )
}
