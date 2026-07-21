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

import { VM_ACTION_ENUM } from '@ConstantsModule'

export const General = [
  VM_ACTION_ENUM.MIGRATE,
  VM_ACTION_ENUM.MIGRATE_LIVE,
  VM_ACTION_ENUM.RELEASE,
  VM_ACTION_ENUM.RESCHED,
  VM_ACTION_ENUM.UNRESCHED,
  VM_ACTION_ENUM.RECOVER,
  VM_ACTION_ENUM.BACKUP_CREATE,
  VM_ACTION_ENUM.BACKUP_RESTORE,
]

export const State = [
  VM_ACTION_ENUM.RESUME,
  VM_ACTION_ENUM.SUSPEND,
  VM_ACTION_ENUM.STOP,
  VM_ACTION_ENUM.POWEROFF,
  VM_ACTION_ENUM.POWEROFF_HARD,
  VM_ACTION_ENUM.REBOOT,
  VM_ACTION_ENUM.REBOOT_HARD,
  VM_ACTION_ENUM.UNDEPLOY,
  VM_ACTION_ENUM.UNDEPLOY_HARD,
  VM_ACTION_ENUM.DEPLOY,
  VM_ACTION_ENUM.HOLD,
]

export const Storage = [
  VM_ACTION_ENUM.DISK_SAVEAS,
  VM_ACTION_ENUM.SNAPSHOT_DISK_CREATE,
  VM_ACTION_ENUM.RESIZE_DISK,
  VM_ACTION_ENUM.DETACH_DISK,
]

export const StorageSnapshot = [
  VM_ACTION_ENUM.SNAPSHOT_DISK_RENAME,
  VM_ACTION_ENUM.SNAPSHOT_DISK_REVERT,
  VM_ACTION_ENUM.SNAPSHOT_DISK_DELETE,
]

export const Network = [
  VM_ACTION_ENUM.UPDATE_NIC,
  VM_ACTION_ENUM.DETACH_NIC,
  VM_ACTION_ENUM.ATTACH_SEC_GROUP,
  VM_ACTION_ENUM.ATTACH_NIC_ALIAS,
]

export const PCI = [VM_ACTION_ENUM.DETACH_PCI]

export const Snapshot = [
  VM_ACTION_ENUM.SNAPSHOT_DELETE,
  VM_ACTION_ENUM.SNAPSHOT_REVERT,
]

export const Backup = [VM_ACTION_ENUM.BACKUP_CONFIGURE]

export const ScheduledAction = [
  VM_ACTION_ENUM.SCHED_ACTION_UPDATE,
  VM_ACTION_ENUM.SCHED_ACTION_DELETE,
]
