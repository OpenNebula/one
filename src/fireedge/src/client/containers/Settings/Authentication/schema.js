/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { object, string } from 'yup'
import { getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

const PUBLIC_KEY_FIELD = {
  name: 'SSH_PUBLIC_KEY',
  label: T.SshPublicKey,
  tooltip: T.AddUserSshPublicKey,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
}

const PRIVATE_KEY_FIELD = {
  name: 'SSH_PRIVATE_KEY',
  label: T.SshPrivateKey,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
}

const PASSPHRASE_FIELD = {
  name: 'SSH_PASSPHRASE',
  label: T.SshPassphraseKey,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
}

export const FIELDS = [PUBLIC_KEY_FIELD, PRIVATE_KEY_FIELD, PASSPHRASE_FIELD]

export const SCHEMA = object(getValidationFromFields(FIELDS))
