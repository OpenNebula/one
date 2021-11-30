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
import { useContext, useMemo } from 'react'
import PropTypes from 'prop-types'

import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'

import StorageList from 'client/components/Tabs/Vm/Storage/List'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { ImageSteps, VolatileSteps } from 'client/components/Forms/Vm'

import {
  getDisks,
  getHypervisor,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getActionsAvailable, jsonToXml } from 'client/models/Helper'
import { T, VM_ACTIONS } from 'client/constants'

const VmStorageTab = ({ tabProps: { actions } = {} }) => {
  const { attachDisk } = useVmApi()

  const { data: vm = {} } = useContext(TabContext)

  const [disks, hypervisor, actionsAvailable] = useMemo(() => {
    const hyperV = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hyperV)
    const actionsByState = actionsByHypervisor.filter(
      (action) => !isAvailableAction(action)(vm)
    )

    return [getDisks(vm), hyperV, actionsByState]
  }, [vm])

  const handleAttachDisk = async (formData) => {
    const template = jsonToXml({ DISK: formData })

    await attachDisk(vm.ID, template)
  }

  return (
    <>
      {actionsAvailable?.includes?.(VM_ACTIONS.ATTACH_DISK) && (
        <ButtonToTriggerForm
          buttonProps={{
            color: 'secondary',
            'data-cy': 'attach-disk',
            label: T.AttachDisk,
            variant: 'outlined',
          }}
          options={[
            {
              cy: 'attach-image-disk',
              name: T.Image,
              dialogProps: { title: T.AttachImage },
              form: () => ImageSteps({ hypervisor }),
              onSubmit: handleAttachDisk,
            },
            {
              cy: 'attach-volatile-disk',
              name: T.Volatile,
              dialogProps: { title: T.AttachVolatile },
              form: () => VolatileSteps({ hypervisor }),
              onSubmit: handleAttachDisk,
            },
          ]}
        />
      )}

      <StorageList actions={actionsAvailable} disks={disks} />
    </>
  )
}

VmStorageTab.propTypes = {
  tabProps: PropTypes.object,
}

VmStorageTab.displayName = 'VmStorageTab'

export default VmStorageTab
