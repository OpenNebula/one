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

import { ROLE_ACTION_ENUM, SERVICE_ACTION_ENUM } from '@ConstantsModule'

export const General = [
  SERVICE_ACTION_ENUM.RENAME,
  SERVICE_ACTION_ENUM.CHANGE_MODE,
  SERVICE_ACTION_ENUM.CHANGE_OWNER,
  SERVICE_ACTION_ENUM.CHANGE_GROUP,
]

export const Recover = [
  SERVICE_ACTION_ENUM.RECOVER,
  SERVICE_ACTION_ENUM.RECOVER_DELETE,
]

export const Delete = [SERVICE_ACTION_ENUM.DELETE]

export const RoleManagement = [
  SERVICE_ACTION_ENUM.ADD_ROLE,
  SERVICE_ACTION_ENUM.SCALE_ROLE,
]

export const RoleSnapshot = [
  ROLE_ACTION_ENUM.SNAPSHOT_CREATE,
  ROLE_ACTION_ENUM.SNAPSHOT_REVERT,
  ROLE_ACTION_ENUM.SNAPSHOT_DELETE,
]

export const RoleDiskSnapshot = [
  ROLE_ACTION_ENUM.DISK_SNAPSHOT_CREATE,
  ROLE_ACTION_ENUM.DISK_SNAPSHOT_REVERT,
  ROLE_ACTION_ENUM.DISK_SNAPSHOT_DELETE,
]

export const RolePerform = [
  ROLE_ACTION_ENUM.RESUME,
  ROLE_ACTION_ENUM.RELEASE,
  ROLE_ACTION_ENUM.HOLD,
  ROLE_ACTION_ENUM.SUSPEND,
  ROLE_ACTION_ENUM.STOP,
  ROLE_ACTION_ENUM.POWEROFF,
  ROLE_ACTION_ENUM.POWEROFF_HARD,
  ROLE_ACTION_ENUM.REBOOT,
  ROLE_ACTION_ENUM.REBOOT_HARD,
  ROLE_ACTION_ENUM.UNDEPLOY,
  ROLE_ACTION_ENUM.UNDEPLOY_HARD,
  ROLE_ACTION_ENUM.TERMINATE,
  ROLE_ACTION_ENUM.TERMINATE_HARD,
]

export const RolePerformMenu = [
  [ROLE_ACTION_ENUM.RESUME, ROLE_ACTION_ENUM.RELEASE, ROLE_ACTION_ENUM.HOLD],
  [
    ROLE_ACTION_ENUM.SUSPEND,
    ROLE_ACTION_ENUM.POWEROFF,
    ROLE_ACTION_ENUM.POWEROFF_HARD,
  ],
  [
    ROLE_ACTION_ENUM.STOP,
    ROLE_ACTION_ENUM.UNDEPLOY,
    ROLE_ACTION_ENUM.UNDEPLOY_HARD,
  ],
  [ROLE_ACTION_ENUM.REBOOT, ROLE_ACTION_ENUM.REBOOT_HARD],
  [ROLE_ACTION_ENUM.TERMINATE, ROLE_ACTION_ENUM.TERMINATE_HARD],
  RoleSnapshot,
  RoleDiskSnapshot,
]

export const Role = [...RolePerform, ...RoleSnapshot, ...RoleDiskSnapshot]
