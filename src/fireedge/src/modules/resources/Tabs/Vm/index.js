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
import { css } from '@emotion/css'
import { OpenNebulaLogo } from '@modules/resources/Icons'
import { Alert, Fade, Stack, useTheme } from '@mui/material'
import { Cancel as CloseIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useSystemData, useViews, VmAPI } from '@FeaturesModule'
import { getAvailableInfoTabs, getErrorMessage, jsonToXml } from '@UtilsModule'
import { Translate } from '@ProvidersModule'

import { SubmitButton } from '@ComponentsV2Module'
import { BaseTab as Tabs } from '@modules/resources/Tabs'
import SingleDetailActions from '@modules/resources/Tabs/SingleDetailActions'
import Backup from '@modules/resources/Tabs/Vm/Backup'
import Configuration from '@modules/resources/Tabs/Vm/Configuration'
import History from '@modules/resources/Tabs/Vm/History'
import Info from '@modules/resources/Tabs/Vm/Info'
import Network from '@modules/resources/Tabs/Vm/Network'
import Pci from '@modules/resources/Tabs/Vm/Pci'
import SchedActions from '@modules/resources/Tabs/Vm/SchedActions'
import Snapshot from '@modules/resources/Tabs/Vm/Snapshot'
import Storage from '@modules/resources/Tabs/Vm/Storage'
import Template from '@modules/resources/Tabs/Vm/Template'
import Logs from '@modules/resources/Tabs/Vm/Logs'

const useStyles = ({ palette }) => ({
  vmError: css({
    '&': {
      marginBottom: '15px',
      backgroundColor: palette.background.paper,
    },
  }),
})

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
    logs: Logs,
  }[tabName])

const VmTabs = memo(({ id, singleActions }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const { view, getResourceView } = useViews()
  const {
    status,
    isError,
    error,
    data: vm = {},
  } = VmAPI.useGetVmQuery({ id }, { refetchOnMountOrArgChange: 10 })
  const [dismissError] = VmAPI.useUpdateUserTemplateMutation()

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
                iconOnly={<CloseIcon />}
                tooltip={<Translate word={T.Dismiss} />}
              />
            }
          >
            {vmError}
          </Alert>
        </Fade>
        <SingleDetailActions selectedRows={vm} singleActions={singleActions} />
        <Tabs addBorder tabs={tabsAvailable} />
      </>
    )
  }

  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <OpenNebulaLogo width={150} height={150} spinner />
    </Stack>
  )
})

VmTabs.propTypes = {
  id: PropTypes.string.isRequired,
  singleActions: PropTypes.func,
}
VmTabs.displayName = 'VmTabs'

export default VmTabs
