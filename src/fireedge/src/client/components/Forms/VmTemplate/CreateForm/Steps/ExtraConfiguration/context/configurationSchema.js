/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { string, boolean, lazy, ObjectSchema } from 'yup'

import { T, INPUT_TYPES } from 'client/constants'
import { Field, getObjectSchemaFromFields, encodeBase64 } from 'client/utils'

const switchField = {
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field} SSH public key field */
export const SSH_PUBLIC_KEY = (isUpdate) => ({
  name: 'CONTEXT.SSH_PUBLIC_KEY',
  label: T.SshPublicKey,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string()
    .trim()
    .notRequired()
    .ensure()
    .default(() => (isUpdate ? undefined : '$USER[SSH_PUBLIC_KEY]')),
  grid: { md: 12 },
  fieldProps: { rows: 4 },
})

/** @type {Field} Network context field */
const NETWORK = (isUpdate) => ({
  name: 'CONTEXT.NETWORK',
  label: T.AddNetworkContextualization,
  tooltip: T.AddNetworkContextualizationConcept,
  type: INPUT_TYPES.SWITCH,
  validation: boolean()
    .yesOrNo()
    .default(() => (isUpdate ? undefined : true)),
  grid: { md: 12 },
})

/** @type {Field} Token OneGate token field */
const TOKEN = {
  name: 'CONTEXT.TOKEN',
  label: T.AddOneGateToken,
  tooltip: T.AddOneGateTokenConcept,
  ...switchField,
}

/** @type {Field} Report READY to OneGate field */
const REPORT_READY = {
  name: 'CONTEXT.REPORT_READY',
  label: T.ReportReadyToOneGate,
  tooltip: T.ReportReadyToOneGateConcept,
  ...switchField,
}

/** @type {Field} Encode start script field */
export const ENCODE_START_SCRIPT = {
  name: 'CONTEXT.ENCODE_START_SCRIPT',
  label: T.EncodeScriptInBase64,
  ...switchField,
  validation: lazy((_, { context }) =>
    boolean()
      .default(() => !!context?.CONTEXT?.START_SCRIPT_BASE64)
      .afterSubmit(() => undefined)
  ),
}

/** @type {Field} Start script field */
export const START_SCRIPT = {
  name: 'CONTEXT.START_SCRIPT',
  label: T.StartScript,
  tooltip: T.StartScriptConcept,
  type: INPUT_TYPES.TEXT,
  dependOf: ENCODE_START_SCRIPT.name,
  multiline: true,
  validation: string()
    .trim()
    .ensure()
    .notRequired()
    .afterSubmit((value, { context }) =>
      context?.extra?.CONTEXT?.ENCODE_START_SCRIPT ||
      context?.CONTEXT?.ENCODE_START_SCRIPT
        ? encodeBase64(value)
        : value
    ),
  grid: { md: 12 },
  fieldProps: { rows: 4 },
}

/** @type {Field} Start script in base64 field */
export const START_SCRIPT_BASE64 = {
  name: 'CONTEXT.START_SCRIPT_BASE64',
  validation: string().strip(),
}

export const SCRIPT_FIELDS = [START_SCRIPT, ENCODE_START_SCRIPT]

/** @type {Field[]} List of other fields */
export const OTHER_FIELDS = (isUpdate) => [
  NETWORK(isUpdate),
  TOKEN,
  REPORT_READY,
]

/** @type {ObjectSchema} User context configuration schema */
export const CONFIGURATION_SCHEMA = (isUpdate) =>
  getObjectSchemaFromFields([
    SSH_PUBLIC_KEY(isUpdate),
    START_SCRIPT_BASE64,
    ...SCRIPT_FIELDS,
    ...OTHER_FIELDS(isUpdate),
  ])
