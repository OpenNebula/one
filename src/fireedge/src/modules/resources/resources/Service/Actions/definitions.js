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
/* eslint-disable jsdoc/require-jsdoc */

import {
  ROLE_ACTIONS,
  ROLE_ACTION_ENUM,
  SERVICE_ACTIONS,
  SERVICE_ACTION_ENUM,
  T,
} from '@ConstantsModule'
import { ServiceAPI } from '@FeaturesModule'
import * as Forms from '@modules/resources/resources/Service/Forms'

export default {
  [SERVICE_ACTION_ENUM.RENAME]: {
    title: T.Rename,
    useMutation: ServiceAPI.useServiceAddActionMutation,
    params: ({ NAME, name } = {}) => ({
      perform: SERVICE_ACTIONS.RENAME,
      params: { name: name ?? NAME },
    }),
  },
  [SERVICE_ACTION_ENUM.CHANGE_MODE]: {
    title: T.Permissions,
    useMutation: ServiceAPI.useServiceAddActionMutation,
    params: ({ octet } = {}) => ({
      perform: SERVICE_ACTIONS.CHANGE_MODE,
      params: { octet },
    }),
  },
  [SERVICE_ACTION_ENUM.CHANGE_OWNER]: {
    title: T.ChangeOwner,
    useMutation: ServiceAPI.useChangeServiceOwnerMutation,
  },
  [SERVICE_ACTION_ENUM.CHANGE_GROUP]: {
    title: T.ChangeGroup,
    useMutation: ServiceAPI.useChangeServiceOwnerMutation,
  },
  [SERVICE_ACTION_ENUM.RECOVER]: {
    title: T.Recover,
    useMutation: ServiceAPI.useRecoverServiceMutation,
    description: T['resource.recover.confirmation'],
    confirmLabel: T.Recover,
  },
  [SERVICE_ACTION_ENUM.RECOVER_DELETE]: {
    title: T.RecoverDelete,
    useMutation: ServiceAPI.useRecoverServiceMutation,
    isDestructive: true,
    description: T['resource.recoverDelete.confirmation'],
    confirmLabel: T.Delete,
    params: { delete: true },
  },
  [SERVICE_ACTION_ENUM.DELETE]: {
    title: T.Delete,
    useMutation: ServiceAPI.useRemoveServiceMutation,
    isDestructive: true,
    description: T['resource.delete.confirmation'],
    confirmLabel: T.Delete,
  },
  [SERVICE_ACTION_ENUM.ADD_ROLE]: {
    title: T.AddRole,
    useMutation: ServiceAPI.useServiceAddRoleMutation,
    form: Forms.AddRoleForm,
    dialogProps: {
      dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
      dialogMaxHeight: 'calc(100vh - 64px)',
      dialogPaperOverflow: 'visible',
      dialogContentMaxHeight: '50vh',
      dialogContentOverflowY: 'auto',
    },
  },
  [SERVICE_ACTION_ENUM.SCALE_ROLE]: {
    title: T.Scale,
    useMutation: ServiceAPI.useServiceScaleRoleMutation,
    form: (formContext) => Forms.ScaleRoleForm({ stepProps: formContext }),
  },
  [ROLE_ACTION_ENUM.DISK_SNAPSHOT_CREATE]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.DISK_SNAPSHOT_CREATE },
  },
  [ROLE_ACTION_ENUM.DISK_SNAPSHOT_DELETE]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.DISK_SNAPSHOT_DELETE },
  },
  [ROLE_ACTION_ENUM.DISK_SNAPSHOT_REVERT]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.DISK_SNAPSHOT_REVERT },
  },
  [ROLE_ACTION_ENUM.HOLD]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.HOLD },
  },
  [ROLE_ACTION_ENUM.POWEROFF]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.POWEROFF },
  },
  [ROLE_ACTION_ENUM.POWEROFF_HARD]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.POWEROFF_HARD },
  },
  [ROLE_ACTION_ENUM.REBOOT]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.REBOOT },
  },
  [ROLE_ACTION_ENUM.REBOOT_HARD]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.REBOOT_HARD },
  },
  [ROLE_ACTION_ENUM.RELEASE]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.RELEASE },
  },
  [ROLE_ACTION_ENUM.RESUME]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.RESUME },
  },
  [ROLE_ACTION_ENUM.SNAPSHOT_CREATE]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.SNAPSHOT_CREATE },
  },
  [ROLE_ACTION_ENUM.SNAPSHOT_DELETE]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.SNAPSHOT_DELETE },
  },
  [ROLE_ACTION_ENUM.SNAPSHOT_REVERT]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.SNAPSHOT_REVERT },
  },
  [ROLE_ACTION_ENUM.STOP]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.STOP },
  },
  [ROLE_ACTION_ENUM.SUSPEND]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.SUSPEND },
  },
  [ROLE_ACTION_ENUM.TERMINATE]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    isDestructive: true,
    params: { perform: ROLE_ACTIONS.TERMINATE },
  },
  [ROLE_ACTION_ENUM.TERMINATE_HARD]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    isDestructive: true,
    params: { perform: ROLE_ACTIONS.TERMINATE_HARD },
  },
  [ROLE_ACTION_ENUM.UNDEPLOY]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.UNDEPLOY },
  },
  [ROLE_ACTION_ENUM.UNDEPLOY_HARD]: {
    useMutation: ServiceAPI.useServiceRoleActionMutation,
    params: { perform: ROLE_ACTIONS.UNDEPLOY_HARD },
  },
}
