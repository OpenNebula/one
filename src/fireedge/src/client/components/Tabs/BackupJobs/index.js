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
import { Alert, Fade, LinearProgress } from '@mui/material'
import { SubmitButton } from 'client/components/FormControl'
import { Translate } from 'client/components/HOC'
import { RESOURCE_NAMES, T } from 'client/constants'
import { useViews } from 'client/features/Auth'
import {
  useGetBackupJobQuery,
  useRetryBackupJobMutation,
} from 'client/features/OneApi/backupjobs'
import { getAvailableInfoTabs } from 'client/models/Helper'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import makeStyles from '@mui/styles/makeStyles'
import Tabs from 'client/components/Tabs'
import Info from 'client/components/Tabs/BackupJobs/Info'
import SchedActions from 'client/components/Tabs/BackupJobs/SchedActions'
import VMs from 'client/components/Tabs/BackupJobs/VMs'

const useStyles = makeStyles(({ palette, typography }) => ({
  alert: {
    '&': {
      margin: '15px 0',
      backgroundColor: palette.background.paper,
    },
  },
  submit: {
    fontSize: '1em',
  },
}))

const getTabComponent = (tabName) =>
  ({
    info: Info,
    vms: VMs,
    sched_actions: SchedActions,
  }[tabName])

const BackupJobTabs = memo(({ id }) => {
  const classes = useStyles()
  const { view, getResourceView } = useViews()
  const { isError, error, status, data = {} } = useGetBackupJobQuery({ id })
  const { TEMPLATE, ERROR_VMS = {} } = data

  const [retry] = useRetryBackupJobMutation()

  const handleRetry = () => retry({ id })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.BACKUPJOBS
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(infoTabs, getTabComponent, id)
  }, [view, id])

  if (isError) {
    return (
      <Alert severity="error" variant="outlined">
        {error.data}
      </Alert>
    )
  }

  if (status === 'fulfilled' || id === data?.ID) {
    return (
      <>
        <Fade in={!!ERROR_VMS?.ID} unmountOnExit>
          <Alert
            variant="outlined"
            severity="error"
            className={classes.alert}
            sx={{ gridColumn: 'span 2' }}
            action={
              <SubmitButton
                className={classes.submit}
                onClick={handleRetry}
                icon={<Translate word={T.Retry} />}
                tooltip={<Translate word={T.Retry} />}
              />
            }
          >
            {TEMPLATE?.ERROR || ''}
          </Alert>
        </Fade>
        <Tabs addBorder tabs={tabsAvailable ?? []} />
      </>
    )
  }

  return <LinearProgress color="secondary" sx={{ width: '100%' }} />
})
BackupJobTabs.propTypes = { id: PropTypes.string.isRequired }
BackupJobTabs.displayName = 'BackupJobTabs'

export default BackupJobTabs
