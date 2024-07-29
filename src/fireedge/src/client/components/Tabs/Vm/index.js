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
import makeStyles from '@mui/styles/makeStyles'
import { Cancel as CloseIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { Translate } from 'client/components/HOC'
import { RESOURCE_NAMES, T } from 'client/constants'
import { useViews, useSystemData } from 'client/features/Auth'
import {
  useGetVmQuery,
  useUpdateUserTemplateMutation,
} from 'client/features/OneApi/vm'
import {
  getAvailableInfoTabs,
  getErrorMessage,
  jsonToXml,
} from 'client/models/Helper'

import { SubmitButton } from 'client/components/FormControl'
import Tabs from 'client/components/Tabs'
import Backup from 'client/components/Tabs/Vm/Backup'
import Configuration from 'client/components/Tabs/Vm/Configuration'
import History from 'client/components/Tabs/Vm/History'
import Info from 'client/components/Tabs/Vm/Info'
import Network from 'client/components/Tabs/Vm/Network'
import SchedActions from 'client/components/Tabs/Vm/SchedActions'
import Snapshot from 'client/components/Tabs/Vm/Snapshot'
import Storage from 'client/components/Tabs/Vm/Storage'
import Template from 'client/components/Tabs/Vm/Template'
import Pci from 'client/components/Tabs/Vm/Pci'

const useStyles = makeStyles(({ palette }) => ({
  vmError: {
    '&': {
      marginBottom: '15px',
      backgroundColor: palette.background.paper,
    },
  },
}))

const getTabComponent = (tabName) =>
  ({
    info: Info,
    network: Network,
    pci: Pci,
    history: History,
    sched_actions: SchedActions,
    snapshot: Snapshot,
    backup: Backup,
    storage: Storage,
    configuration: Configuration,
    template: Template,
  }[tabName])

const VmTabs = memo(({ id }) => {
  const classes = useStyles()
  const { view, getResourceView } = useViews()
  const {
    status,
    isError,
    error,
    data: vm = {},
  } = useGetVmQuery({ id }, { refetchOnMountOrArgChange: 10 })
  const [dismissError] = useUpdateUserTemplateMutation()

  const { USER_TEMPLATE, ID } = vm

  const { adminGroup, oneConfig } = useSystemData()

  const handleDismissError = async () => {
    const { ERROR, SCHED_MESSAGE, ...templateWithoutError } = USER_TEMPLATE
    const xml = jsonToXml({ ...templateWithoutError })

    await dismissError({ id, template: xml, replace: 0 })
  }

  const vmError = useMemo(() => getErrorMessage(vm), [vm])

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VM
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(
      infoTabs,
      getTabComponent,
      id,
      oneConfig,
      adminGroup
    )
  }, [view, id])

  if (isError) {
    return (
      <Alert severity="error" variant="outlined">
        {error.data}
      </Alert>
    )
  }

  if (status === 'fulfilled' || id === ID) {
    return (
      <>
        <Fade in={!!vmError} unmountOnExit>
          <Alert
            variant="outlined"
            severity="error"
            className={classes.vmError}
            sx={{ gridColumn: 'span 2' }}
            action={
              <SubmitButton
                onClick={handleDismissError}
                icon={<CloseIcon />}
                tooltip={<Translate word={T.Dismiss} />}
              />
            }
          >
            {vmError}
          </Alert>
        </Fade>
        <Tabs addBorder tabs={tabsAvailable} />
      </>
    )
  }

  return <LinearProgress color="secondary" sx={{ width: '100%' }} />
})

VmTabs.propTypes = { id: PropTypes.string.isRequired }
VmTabs.displayName = 'VmTabs'

export default VmTabs
