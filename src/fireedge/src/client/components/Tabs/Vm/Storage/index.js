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
import * as React from 'react'
import PropTypes from 'prop-types'
import { Button } from '@material-ui/core'

import { useDialog } from 'client/hooks'
import { TabContext } from 'client/components/Tabs/TabProvider'
import { DialogConfirmation } from 'client/components/Dialogs'
import StorageList from 'client/components/Tabs/Vm/Storage/List'
import { Tr } from 'client/components/HOC'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { T, VM_ACTIONS } from 'client/constants'

const VmStorageTab = ({ tabProps = {} }) => {
  const { display, show, hide } = useDialog()
  const { data: vm } = React.useContext(TabContext)
  const { actions = [] } = tabProps

  const disks = VirtualMachine.getDisks(vm)

  const hypervisor = VirtualMachine.getHypervisor(vm)
  const actionsAvailable = Helper.getActionsAvailable(actions, hypervisor)

  return (
    <>
      {actionsAvailable?.includes?.(VM_ACTIONS.ATTACH_DISK) && (
        <Button
          data-cy='attach-disk'
          size='small'
          color='secondary'
          onClick={show}
          variant='contained'
        >
          {Tr(T.AttachDisk)}
        </Button>
      )}

      <StorageList actions={actionsAvailable} disks={disks} />

      {display && (
        <DialogConfirmation
          title={T.AttachDisk}
          handleAccept={hide}
          handleCancel={hide}
        >
          <p>TODO: should define in view yaml ??</p>
        </DialogConfirmation>
      )}
    </>
  )
}

VmStorageTab.propTypes = {
  tabProps: PropTypes.object
}

VmStorageTab.displayName = 'VmStorageTab'

export default VmStorageTab
