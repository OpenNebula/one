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
import { string, boolean, ref, ObjectSchema } from 'yup'

import { T, INPUT_TYPES } from 'client/constants'
import { Field, getObjectSchemaFromFields, decodeBase64 } from 'client/utils'

const switchField = {
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field} SSH public key field */
export const SSH_PUBLIC_KEY = {
  name: 'CONTEXT.SSH_PUBLIC_KEY',
  label: T.SshPublicKey,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim().notRequired().ensure(),
  grid: { md: 12 },
  fieldProps: { rows: 4 },
}

/** @type {Field} Network context field */
const NETWORK = {
  name: 'CONTEXT.NETWORK',
  label: T.AddNetworkContextualization,
  tooltip: T.AddNetworkContextualizationConcept,
  ...switchField,
}

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
  validation: boolean()
    .transform((value) => Boolean(value))
    .default(() => ref('$extra.CONTEXT.START_SCRIPT_BASE64')),
}

/** @type {Field} Start script field */
export const START_SCRIPT = {
  name: 'CONTEXT.START_SCRIPT',
  label: T.StartScript,
  tooltip: T.StartScriptConcept,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string()
    .trim()
    .notRequired()
    .ensure()
    .when('$extra.CONTEXT.START_SCRIPT_BASE64', (scriptEncoded, schema) =>
      scriptEncoded ? schema.default(() => decodeBase64(scriptEncoded)) : schema
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
export const OTHER_FIELDS = [NETWORK, TOKEN, REPORT_READY]

/** @type {ObjectSchema} User context configuration schema */
export const CONFIGURATION_SCHEMA = getObjectSchemaFromFields([
  SSH_PUBLIC_KEY,
  START_SCRIPT_BASE64,
  ...SCRIPT_FIELDS,
  ...OTHER_FIELDS,
])
