/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useContext } from 'react'
import PropTypes from 'prop-types'

import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'

import StorageList from 'client/components/Tabs/Vm/Storage/List'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { ImageSteps, VolatileSteps } from 'client/components/Forms/Vm'
import { Tr } from 'client/components/HOC'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { T, VM_ACTIONS } from 'client/constants'

const VmStorageTab = ({ tabProps: { actions } = {} }) => {
  const { attachDisk } = useVmApi()

  const { data: vm = {} } = useContext(TabContext)

  const disks = VirtualMachine.getDisks(vm)
  const hypervisor = VirtualMachine.getHypervisor(vm)
  const actionsAvailable = Helper.getActionsAvailable(actions, hypervisor)

  const handleAttachDisk = async ({ image, advanced, configuration }) => {
    const imageSelected = image?.[0]
    const root = { ...imageSelected, ...advanced, ...configuration }

    const template = Helper.jsonToXml({ DISK: root })

    await attachDisk(vm.ID, template)
  }

  return (
    <>
      {actionsAvailable?.includes?.(VM_ACTIONS.ATTACH_DISK) && (
        <ButtonToTriggerForm
          buttonProps={{
            color: 'secondary',
            'data-cy': 'attach-disk',
            label: `${Tr(T.Attach)} ${Tr(T.Disk)}`
          }}
          dialogProps={{
            title: `${Tr(T.Attach)} ${Tr(T.Disk)}`
          }}
          options={[
            {
              cy: 'attach-image-disk',
              name: T.Image,
              form: () => ImageSteps({ hypervisor }),
              onSubmit: handleAttachDisk
            },
            {
              cy: 'attach-volatile-disk',
              name: T.Volatile,
              form: () => VolatileSteps({ hypervisor }),
              onSubmit: handleAttachDisk
            }
          ]}
        />
      )}

      <StorageList actions={actionsAvailable} disks={disks} />
    </>
  )
}

VmStorageTab.propTypes = {
  tabProps: PropTypes.object
}

VmStorageTab.displayName = 'VmStorageTab'

export default VmStorageTab
