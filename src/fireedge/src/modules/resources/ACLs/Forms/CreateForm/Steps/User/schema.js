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
import { User, Group, Community } from 'iconoir-react'
import { INPUT_TYPES, T } from '@ConstantsModule'
import {
  OPTION_SORTERS,
  Field,
  getObjectSchemaFromFields,
  arrayToOptions,
} from '@UtilsModule'
import { string } from 'yup'
import {
  GROUP_LIST_COLUMNS,
  groupTable,
  USER_LIST_COLUMNS,
  userTable,
} from '@ModelsModule'

const USER_TYPE_ICONS = {
  INDIVIDUAL: User,
  GROUP: Group,
  ALL: Community,
}

const ACL_TYPE_ID_USER_TRANSLATIONS = {
  INDIVIDUAL: { value: 'INDIVIDUAL', text: T.AUser },
  GROUP: { value: 'GROUP', text: T.AGroup },
  ALL: { value: 'ALL', text: T.AllUsers },
}

const userSelectorTable = {
  dataCy: userTable.dataCy,
  columns: () => userTable.columns(USER_LIST_COLUMNS),
  useData: userTable.useData,
}

const groupSelectorTable = {
  dataCy: groupTable.dataCy,
  columns: () => groupTable.columns(GROUP_LIST_COLUMNS),
  useData: groupTable.useData,
}

/** @type {Field} Type field */
export const TYPE = {
  name: 'TYPE',
  label: T.ApplyRuleTo,
  type: INPUT_TYPES.BUTTON_GROUP,
  values: () =>
    arrayToOptions(Object.keys(ACL_TYPE_ID_USER_TRANSLATIONS), {
      addEmpty: false,
      sorter: OPTION_SORTERS.unsort,
      getText: (key) => ACL_TYPE_ID_USER_TRANSLATIONS[key].text,
      getValue: (key) => ACL_TYPE_ID_USER_TRANSLATIONS[key].value,
    }).map((option) => ({
      ...option,
      startIcon: USER_TYPE_ICONS[option.value],
    })),
  validation: string()
    .trim()
    .required()
    .uppercase()
    .default(() => undefined),
  grid: { md: 12 },
}

const INDIVIDUAL = {
  name: 'INDIVIDUAL',
  label: T['acls.form.create.user.individual'],
  type: INPUT_TYPES.TABLE,
  dependOf: TYPE.name,
  htmlType: (type) =>
    (!type || type !== ACL_TYPE_ID_USER_TRANSLATIONS.INDIVIDUAL.value) &&
    INPUT_TYPES.HIDDEN,
  model: userSelectorTable,
  selectOnRowClick: true,
  singleSelect: true,
  fieldProps: {
    preserveState: true,
    isEnableSearchBar: true,
    size: 'medium',
  },
  validation: string()
    .trim()
    .when(TYPE.name, (type, schema) =>
      type !== ACL_TYPE_ID_USER_TRANSLATIONS.INDIVIDUAL.value
        ? schema.strip()
        : schema.required()
    )
    .default(() => undefined),
  grid: { md: 12 },
}

const GROUP = {
  name: 'GROUP',
  label: T['acls.form.create.user.group'],
  type: INPUT_TYPES.TABLE,
  dependOf: TYPE.name,
  htmlType: (type) =>
    (!type || type !== ACL_TYPE_ID_USER_TRANSLATIONS.GROUP.value) &&
    INPUT_TYPES.HIDDEN,
  model: groupSelectorTable,
  selectOnRowClick: true,
  singleSelect: true,
  fieldProps: {
    preserveState: true,
    isEnableSearchBar: true,
    size: 'medium',
  },
  validation: string()
    .trim()
    .when(TYPE.name, (type, schema) =>
      type !== ACL_TYPE_ID_USER_TRANSLATIONS.GROUP.value
        ? schema.strip()
        : schema.required()
    )
    .default(() => undefined),
  grid: { md: 12 },
}

const FIELDS = [TYPE, INDIVIDUAL, GROUP]

const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { SCHEMA, FIELDS }
