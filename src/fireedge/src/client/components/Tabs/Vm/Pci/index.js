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
import { ReactElement, useMemo, useEffect } from 'react'
import { Stack, Alert } from '@mui/material'
import PropTypes from 'prop-types'

import { getActionsAvailable, jsonToXml } from 'client/models/Helper'
import {
  getPcis,
  getHypervisor,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getPciDevices } from 'client/models/Host'
import { VM_ACTIONS, T } from 'client/constants'
import {
  AttachPciAction,
  DetachPciAction,
} from 'client/components/Tabs/Vm/Pci/Actions'
import { PciCard } from 'client/components/Cards'
import { transformPciToString } from 'client/components/Forms/Vm/AttachPciForm/schema'
import makeStyles from '@mui/styles/makeStyles'
import { Tr } from 'client/components/HOC'
import { useGeneralApi } from 'client/features/General'
import {
  useGetVmQuery,
  useAttachPciMutation,
  useDetachPciMutation,
} from 'client/features/OneApi/vm'
import { useGetHostsQuery } from 'client/features/OneApi/host'
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
  // Style for info message
  const useStyles = makeStyles(({ palette }) => ({
    warningInfo: {
      '&': {
        gridColumn: 'span 2',
        marginTop: '1em',
        marginBottom: '1em',
        backgroundColor: palette.background.paper,
      },
    },
  }))

  const classes = useStyles()

  // General api for enqueue
  const { enqueueSuccess } = useGeneralApi()

  // API to attach and detach PCI
  const [attachPci, { isSuccess: isSuccessAttachPci }] = useAttachPciMutation()
  const [detachPci, { isSuccess: isSuccessDetachPci }] = useDetachPciMutation()

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
  const { data: vm } = useGetVmQuery({ id })

  // Get pcis in hosts
  const { data: hosts = [] } = useGetHostsQuery()
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
      isAvailableAction(action, vm)
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

            const pciCompleted = {
              ...pci,
              PCI_DEVICE_NAME: transformPciToString(pci),
              DEVICE_NAME: pciHostDevice
                ? pciHostDevice.DEVICE_NAME
                : pci.DEVICE,
              VENDOR_NAME: pciHostDevice
                ? pciHostDevice.VENDOR_NAME
                : pci.VENDOR,
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

export default PciTab
