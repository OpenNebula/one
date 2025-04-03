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
import { ReactElement, useMemo, useEffect } from 'react'
import { useTheme, Stack, Alert } from '@mui/material'
import { css } from '@emotion/css'

import PropTypes from 'prop-types'
import {
  getActionsAvailable,
  jsonToXml,
  getPcis,
  getHypervisor,
  isVmAvailableAction,
  getPciDevices,
} from '@ModelsModule'
import { VM_ACTIONS, T } from '@ConstantsModule'
import {
  AttachPciAction,
  DetachPciAction,
} from '@modules/components/Tabs/Vm/Pci/Actions'
import { PciCard } from '@modules/components/Cards'
import { transformPciToString } from '@modules/components/Forms/Vm/AttachPciForm/schema'
import { Tr } from '@modules/components/HOC'
import { useGeneralApi, VmAPI, HostAPI } from '@FeaturesModule'
import { find } from 'lodash'

const { ATTACH_PCI, DETACH_PCI } = VM_ACTIONS

/**
 * Renders the list of disks from a VM.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Machine id
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Storage tab
 */
const PciTab = ({ tabProps: { actions } = {}, id, oneConfig, adminGroup }) => {
  const theme = useTheme()
  // Style for info message
  const useStyles = ({ palette }) => ({
    warningInfo: css({
      '&': {
        gridColumn: 'span 2',
        marginTop: '1em',
        marginBottom: '1em',
        backgroundColor: palette.background.paper,
      },
    }),
  })

  const classes = useMemo(() => useStyles(theme), [theme])

  // General api for enqueue
  const { enqueueSuccess } = useGeneralApi()

  // API to attach and detach PCI
  const [attachPci, { isSuccess: isSuccessAttachPci }] =
    VmAPI.useAttachPciMutation()
  const [detachPci, { isSuccess: isSuccessDetachPci }] =
    VmAPI.useDetachPciMutation()

  // Success messages
  const successMessageAttachPci = `${Tr(T.AttachPciSuccess, [id])}`
  useEffect(
    () => isSuccessAttachPci && enqueueSuccess(successMessageAttachPci),
    [isSuccessAttachPci]
  )
  const successMessageDetachPci = `${Tr(T.DetachPciSuccess, [id])}`
  useEffect(
    () => isSuccessDetachPci && enqueueSuccess(successMessageDetachPci),
    [isSuccessDetachPci]
  )

  // Get data from vm
  const { data: vm } = VmAPI.useGetVmQuery({ id })

  // Get pcis in hosts
  const { data: hosts = [] } = HostAPI.useGetHostsQuery()
  const hostPciDevices = hosts.map(getPciDevices).flat()

  const handleAttachPci = async (pci) => {
    delete pci.SPECIFIC_DEVICE
    await attachPci({
      id: id,
      template: jsonToXml({ PCI: pci }),
    })
  }

  const handleRemovePci = (pciId) => async () =>
    await detachPci({ id: id, pci: pciId })

  // Set pcis and actions
  const [pciDevices, actionsAvailable] = useMemo(() => {
    const hyperV = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hyperV)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isVmAvailableAction(action, vm)
    )

    return [getPcis(vm), actionsByState]
  }, [vm])

  const isPciSupported = actionsAvailable?.includes(ATTACH_PCI)

  return (
    <>
      <Alert severity="info" variant="outlined" className={classes.warningInfo}>
        {Tr(T.NicPciWarning)}
      </Alert>
      {isPciSupported ? (
        <>
          {actionsAvailable?.includes?.(ATTACH_PCI) && (
            <div>
              <AttachPciAction
                oneConfig={oneConfig}
                adminGroup={adminGroup}
                onSubmit={handleAttachPci}
                indexPci={pciDevices.length}
              />
            </div>
          )}
        </>
      ) : (
        <Alert
          severity="info"
          variant="outlined"
          className={classes.warningInfo}
        >
          {Tr(T.PciAttachWarning)}
        </Alert>
      )}
      <div>
        <Stack gap="1em" py="0.8em">
          {pciDevices.map((pci, index) => {
            const pciHostDevice = find(hostPciDevices, {
              SHORT_ADDRESS: pci.SHORT_ADDRESS,
            })

            // Complete PCI data (if the PCI is a specific device, the vm doesn't store the data about vendor, device and class)
            const pciCompleted = {
              ...pci,
              PCI_DEVICE_NAME: pciHostDevice
                ? transformPciToString(pciHostDevice)
                : transformPciToString(pci),
              DEVICE: pciHostDevice ? pciHostDevice?.DEVICE : pci?.DEVICE,
              DEVICE_NAME: pciHostDevice
                ? pciHostDevice.DEVICE_NAME
                : pci.DEVICE,
              VENDOR: pciHostDevice ? pciHostDevice?.VENDOR : pci?.VENDOR,
              VENDOR_NAME: pciHostDevice
                ? pciHostDevice.VENDOR_NAME
                : pci.VENDOR,
              CLASS: pciHostDevice ? pciHostDevice?.CLASS : pci?.CLASS,
              CLASS_NAME: pciHostDevice ? pciHostDevice.CLASS_NAME : pci.CLASS,
              SPECIFIC_DEVICE: !!pci.SHORT_ADDRESS,
            }

            return (
              <PciCard
                key={index}
                pci={pciCompleted}
                indexPci={index}
                actions={
                  <>
                    {isPciSupported &&
                      actionsAvailable.includes(DETACH_PCI) && (
                        <DetachPciAction
                          indexPci={index}
                          onSubmit={handleRemovePci(pci.PCI_ID)}
                          oneConfig={oneConfig}
                          adminGroup={adminGroup}
                        />
                      )}
                  </>
                }
              />
            )
          })}
        </Stack>
      </div>
    </>
  )
}

PciTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

PciTab.displayName = 'PciTab'
PciTab.label = T.Pci

export default PciTab
