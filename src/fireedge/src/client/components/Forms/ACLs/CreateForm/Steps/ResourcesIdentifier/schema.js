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
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getObjectSchemaFromFields, arrayToOptions } from 'client/utils'
import { string } from 'yup'
import { GroupsTable, ClustersTable } from 'client/components/Tables'

// Types of id definition
export const ACL_TYPE_ID_TRANSLATIONS = {
  INDIVIDUAL: {
    value: 'INDIVIDUAL',
    text: T.Identifier,
  },
  GROUP: { value: 'GROUP', text: T.Group },
  ALL: { value: 'ALL', text: T.All },
  CLUSTER: { value: 'CLUSTER', text: T.Cluster },
}

/** @type {Field} Type field */
export const TYPE = {
  name: 'TYPE',
  type: INPUT_TYPES.TOGGLE,
  values: () =>
    arrayToOptions(Object.keys(ACL_TYPE_ID_TRANSLATIONS), {
      addEmpty: false,
      getText: (key) => ACL_TYPE_ID_TRANSLATIONS[key].text,
      getValue: (key) => ACL_TYPE_ID_TRANSLATIONS[key].value,
    }),
  validation: string()
    .trim()
    .required()
    .uppercase()
    .default(() => undefined),
  grid: { md: 12 },
}

const INDIVIDUAL = {
  name: 'INDIVIDUAL',
  label: T['acls.form.create.resourcesUser.individual'],
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: (type) =>
    (!type || type !== ACL_TYPE_ID_TRANSLATIONS.INDIVIDUAL.value) &&
    INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(TYPE.name, (type, schema) =>
      type !== ACL_TYPE_ID_TRANSLATIONS.INDIVIDUAL.value
        ? schema.strip()
        : schema.required()
    )
    .default(() => undefined),
  grid: { md: 12 },
}

const GROUP = {
  name: 'GROUP',
  label: T['acls.form.create.resourcesUser.group'],
  type: INPUT_TYPES.TABLE,
  dependOf: TYPE.name,
  htmlType: (type) =>
    (!type || type !== ACL_TYPE_ID_TRANSLATIONS.GROUP.value) &&
    INPUT_TYPES.HIDDEN,
  Table: () => GroupsTable,
  validation: string()
    .trim()
    .when(TYPE.name, (type, schema) =>
      type !== ACL_TYPE_ID_TRANSLATIONS.GROUP.value
        ? schema.strip()
        : schema.required()
    )
    .default(() => undefined),
  grid: { md: 12 },
}

const CLUSTER = {
  name: 'CLUSTER',
  label: T['acls.form.create.resourcesUser.cluster'],
  type: INPUT_TYPES.TABLE,
  dependOf: TYPE.name,
  htmlType: (type) =>
    (!type || type !== ACL_TYPE_ID_TRANSLATIONS.CLUSTER.value) &&
    INPUT_TYPES.HIDDEN,
  Table: () => ClustersTable,
  validation: string()
    .trim()
    .when(TYPE.name, (type, schema) =>
      type !== ACL_TYPE_ID_TRANSLATIONS.CLUSTER.value
        ? schema.strip()
        : schema.required()
    )
    .default(() => undefined),
  grid: { md: 12 },
}

const FIELDS = [TYPE, INDIVIDUAL, GROUP, CLUSTER]

const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { SCHEMA, FIELDS }
