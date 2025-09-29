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
// eslint-disable-next-line prettier/prettier, no-unused-vars
import { VmQuota, NetworkQuota, DatastoreQuota, ImageQuota } from '@modules/constants/quota'
import * as ACTIONS from '@modules/constants/actions'
import { COLOR } from '@modules/constants/color'
import * as STATES from '@modules/constants/states'

/**
 * @typedef LoginToken
 * @property {string} TOKEN - Token
 * @property {string|number} EXPIRATION_TIME - Expiration time
 * @property {string} EGID - ??
 */

/**
 * @typedef User
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {string|number} GID - Group id
 * @property {string} GNAME - Group name
 * @property {{ ID: string[] }} GROUPS - List of group ids
 * @property {string} PASSWORD - Password
 * @property {string} AUTH_DRIVER - Driver to authenticate
 * @property {'0'|'1'} ENABLED - If `0` the user is enabled
 * @property {LoginToken|LoginToken[]} [LOGIN_TOKEN] - Token to login
 * @property {object} TEMPLATE - Template
 * @property {string} [TEMPLATE.TOKEN_PASSWORD] - Password token
 * @property {{ DATASTORE: DatastoreQuota|DatastoreQuota[] }} [DATASTORE_QUOTA] - Datastore quotas
 * @property {{ NETWORK: NetworkQuota|NetworkQuota[] }} [NETWORK_QUOTA] - Network quotas
 * @property {{ VM: VmQuota }} [VM_QUOTA] - VM quotas
 * @property {{ IMAGE: ImageQuota|ImageQuota[] }} [IMAGE_QUOTA] - Image quotas
 * @property {{
 * DATASTORE: DatastoreQuota|DatastoreQuota[],
 * NETWORK: NetworkQuota|NetworkQuota[],
 * VM: VmQuota,
 * IMAGE: ImageQuota|ImageQuota[]
 * }} [DEFAULT_USER_QUOTAS] - Default quotas
 */

export const USER_STATES = [
  {
    name: STATES.DISABLED,
    shortName: 'off',
    color: COLOR.error.dark,
  },
  {
    name: STATES.ENABLED,
    shortName: 'on',
    color: COLOR.success.main,
  },
]

export const USER_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  QUOTAS_DIALOG: 'quotas_dialog',
  GROUPS_DIALOG: 'groups_dialog',
  UPDATE_PASSWORD: 'update_password',
  DELETE: 'delete',
  EDIT_ADMINS: 'edit_admins',
  LOGIN_TOKEN: 'login_token',
  TFA: 'two_factor_auth',
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
  CHANGE_AUTH: 'change_authentication',
  ENABLE: 'enable',
  DISABLE: 'disable',
  ADD_TO_GROUP: 'add_to_group',
  REMOVE_FROM_GROUP: 'remove_from_group',
  CHANGE_PRIMARY_GROUP: 'change_primary_group',
}

export const AUTH_DRIVER = {
  CORE: 'core',
  PUBLIC: 'public',
  SSH: 'ssh',
  X509: 'x509',
  LDAP: 'ldap',
  SAML: 'saml',
  SERVER_CIPHER: 'server_cipher',
  SERVER_X509: 'server_x509',
  CUSTOM: 'custom',
}

export const TABLE_VIEW_MODE = {
  CARD: 'card',
  LIST: 'list',
}
