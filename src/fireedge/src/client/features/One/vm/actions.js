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
import { RESOURCES } from 'client/features/One/slice'

/** @see {@link RESOURCES.vm}  */
const VM = 'vm'

export const getVm = createAction(`${VM}/detail`, vmService.getVm)

export const getVms = createAction(
  `${VM}/pool`,
  vmService.getVms,
  (response, { vms: currentVms }) => {
    const vms = filterBy([...currentVms, ...response], 'ID')

    return { [RESOURCES.vm]: vms }
  }
)

export const terminateVm = createAction(
  `${VM}/delete`,
  payload => vmService.actionVm({
    ...payload,
    action: {
      params: { hard: false },
      perform: 'terminate'
    }
  })
)

export const updateUserTemplate = createAction(`${VM}/update`, vmService.updateUserTemplate)
export const rename = createAction(`${VM}/rename`, vmService.rename)
export const resize = createAction(`${VM}/resize`, vmService.resize)
export const changePermissions = createAction(`${VM}/chmod`, vmService.changePermissions)
export const changeOwnership = createAction(`${VM}/chown`, vmService.changeOwnership)
export const attachDisk = createAction(`${VM}/attach/disk`, vmService.attachDisk)
export const detachDisk = createAction(`${VM}/detach/disk`, vmService.detachDisk)
export const saveAsDisk = createAction(`${VM}/saveas/disk`, vmService.saveAsDisk)
export const resizeDisk = createAction(`${VM}/resize/disk`, vmService.resizeDisk)
export const createDiskSnapshot = createAction(`${VM}/create/disk-snapshot`, vmService.createDiskSnapshot)
export const renameDiskSnapshot = createAction(`${VM}/rename/disk-snapshot`, vmService.renameDiskSnapshot)
export const revertDiskSnapshot = createAction(`${VM}/revert/disk-snapshot`, vmService.revertDiskSnapshot)
export const deleteDiskSnapshot = createAction(`${VM}/delete/disk-snapshot`, vmService.deleteDiskSnapshot)
export const attachNic = createAction(`${VM}/attach/nic`, vmService.attachNic)
export const detachNic = createAction(`${VM}/detach/nic`, vmService.detachNic)
export const createSnapshot = createAction(`${VM}/create/snapshot`, vmService.createSnapshot)
export const revertSnapshot = createAction(`${VM}/revert/snapshot`, vmService.revertSnapshot)
export const deleteSnapshot = createAction(`${VM}/delete/snapshot`, vmService.deleteSnapshot)
export const addScheduledAction = createAction(`${VM}/add/scheduled-action`, vmService.addScheduledAction)
export const updateScheduledAction = createAction(`${VM}/update/scheduled-action`, vmService.updateScheduledAction)
export const deleteScheduledAction = createAction(`${VM}/delete/scheduled-action`, vmService.deleteScheduledAction)
