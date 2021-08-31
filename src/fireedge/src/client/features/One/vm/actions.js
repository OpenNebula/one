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
import { createAction } from 'client/features/One/utils'
import { vmService } from 'client/features/One/vm/services'
import { filterBy } from 'client/utils'

export const getVm = createAction('vm/detail', vmService.getVm)

export const getVms = createAction(
  'vm/pool',
  vmService.getVms,
  (response, { vms: currentVms }) => {
    const vms = filterBy([...currentVms, ...response], 'ID')

    return { vms }
  }
)

export const terminateVm = createAction(
  'vm/delete',
  payload => vmService.actionVm({
    ...payload,
    action: {
      params: { hard: false },
      perform: 'terminate'
    }
  })
)

export const updateUserTemplate = createAction('vm/update', vmService.updateUserTemplate)
export const rename = createAction('vm/rename', vmService.rename)
export const resize = createAction('vm/resize', vmService.resize)
export const changePermissions = createAction('vm/chmod', vmService.changePermissions)
export const changeOwnership = createAction('vm/chown', vmService.changeOwnership)
export const attachDisk = createAction('vm/attach/disk', vmService.attachDisk)
export const detachDisk = createAction('vm/detach/disk', vmService.detachDisk)
export const saveAsDisk = createAction('vm/saveas/disk', vmService.saveAsDisk)
export const resizeDisk = createAction('vm/resize/disk', vmService.resizeDisk)
export const createDiskSnapshot = createAction('vm/create/disk-snapshot', vmService.createDiskSnapshot)
export const renameDiskSnapshot = createAction('vm/rename/disk-snapshot', vmService.renameDiskSnapshot)
export const revertDiskSnapshot = createAction('vm/revert/disk-snapshot', vmService.revertDiskSnapshot)
export const deleteDiskSnapshot = createAction('vm/delete/disk-snapshot', vmService.deleteDiskSnapshot)
export const attachNic = createAction('vm/attach/nic', vmService.attachNic)
export const detachNic = createAction('vm/detach/nic', vmService.detachNic)
export const createSnapshot = createAction('vm/create/snapshot', vmService.createSnapshot)
export const revertSnapshot = createAction('vm/revert/snapshot', vmService.revertSnapshot)
export const deleteSnapshot = createAction('vm/delete/snapshot', vmService.deleteSnapshot)
export const addScheduledAction = createAction('vm/add/scheduled-action', vmService.addScheduledAction)
export const updateScheduledAction = createAction('vm/update/scheduled-action', vmService.updateScheduledAction)
export const deleteScheduledAction = createAction('vm/delete/scheduled-action', vmService.deleteScheduledAction)
