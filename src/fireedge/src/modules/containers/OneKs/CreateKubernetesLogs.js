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
import {
  SkeletonStepsForm,
  TranslateProvider,
  SubmitButton,
  PATH,
  Tr,
  LogsViewer,
  StatusChip,
} from '@ComponentsModule'
import {
  Stack,
  Typography,
  useTheme,
  LinearProgress,
  CircularProgress,
} from '@mui/material'
import { OneKsAPI } from '@FeaturesModule'
import { T, STYLE_BUTTONS, ONEKS_OPERATIONS } from '@ConstantsModule'
import { styles } from '@modules/containers/Clusters/styles'
import { last, filter, find } from 'lodash'
import { getOneKsProgress, getVirtualOneKsState } from '@ModelsModule'
import { useHistory } from 'react-router'

/**
 * Displays the creation form for a cluster.
 *
 * @returns {ReactElement} - The Kubernetes logs component
 */
export function CreateKubernetesLogs() {
  // Get styles
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

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
  const { data: kubernetes, refetch } = OneKsAPI.useGetOneKsClusterQuery(
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
  const { data: logsData } = OneKsAPI.useGetKubernetesLogsQuery(
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
      const message = matchDate ? matchDate[2] : log.text

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
    description: Tr(T['oneks.logs.create.logs']),
    operation: Tr(T[operationText], [document?.NAME]),
  }

  return logsData ? (
    <TranslateProvider>
      <Stack direction="column">
        <Typography variant="subtitle2">{translations.description}</Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ marginTop: '10px' }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="start"
            spacing={2}
          >
            <Typography className={classes.titleText}>
              {operationText ? translations.operation : document?.NAME}
            </Typography>
            <StatusChip
              dataCy="state"
              stateColor={stateColor}
              text={stateName}
            />
            {!isFinalState && <CircularProgress size={20} />}
          </Stack>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="start"
            spacing={2}
          >
            <SubmitButton
              data-cy={`button-background`}
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              onClick={() => history.push(PATH.ONEKS.LIST)}
              label={isFinalState ? T.Close : T.RunBackground}
            />
          </Stack>
        </Stack>
        <Stack
          direction="column"
          sx={{ width: '100%', margin: '15px 0', gap: '4px' }}
        >
          {progress < 100 && (
            <Typography className={classes.infoText}>
              {lastInfo(logsData)}
            </Typography>
          )}
          <LinearProgress
            variant="determinate"
            value={progress}
            classes={{
              root: classes.root,
              bar: progress >= 100 ? classes.solidBar : classes.animatedBar,
            }}
          />
        </Stack>
        <LogsViewer
          logs={logsData}
          options={{ followLogs: true }}
          provisionId={id}
          getLogs={refetch}
          onRetry={() => recover({ id })}
          messageSuccessRetry={T.SuccessOneKsRetried}
          messageErrorRetry={T.ErrorOneKsRetried}
          showShimmer
          state={!isFinalState}
        />
      </Stack>
    </TranslateProvider>
  ) : (
    <SkeletonStepsForm />
  )
}
