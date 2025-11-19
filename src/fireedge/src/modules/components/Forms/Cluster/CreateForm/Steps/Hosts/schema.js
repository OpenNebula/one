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
import { INPUT_TYPES, T } from '@ConstantsModule'
import { HostAPI } from '@FeaturesModule'
import { getKvmCpuModels } from '@ModelsModule'
import { HostsTable } from '@modules/components/Tables'
import {
  arrayToOptions,
  Field,
  getObjectSchemaFromFields,
  OPTION_SORTERS,
} from '@UtilsModule'
import { array, string } from 'yup'

const HOST_NAME = 'ID'
let previousValue

/** @type {Field} EVC_MODE field */
const EVC_MODE = {
  name: 'EVC_MODE',
  label: T.EvcMode,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  freeSolo: true,
  dependOf: HOST_NAME,
  watcher: (hosts, { formContext }) => {
    const { initialValues } = formContext

    !previousValue && (previousValue = hosts)
    if (Array.isArray(previousValue)) {
      const prevArray = [...previousValue].sort((a, b) => a - b)
      const currentArra = [...hosts].sort((a, b) => a - b)
      if (prevArray.every((value, index) => value === currentArra[index])) {
        return initialValues?.TEMPLATE?.EVC_MODE
      } else {
        return ''
      }
    }
  },
  values: (selectedHosts = []) => {
    let options = []
    const { data: hosts = [] } = HostAPI.useGetHostsQuery()

    if (selectedHosts.length) {
      const selectedHostsSet = new Set(selectedHosts)
      const dataHosts = hosts.filter((host) => selectedHostsSet.has(host?.ID))
      options = getKvmCpuModels(dataHosts, true)
    }

    return arrayToOptions(options, {
      addEmpty: true,
      getText: (name) => name,
      getValue: (value) => value,
      sorter: OPTION_SORTERS.unsort,
    })
  },
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} HostsTable field */
const HOSTS = {
  name: HOST_NAME,
  label: T.SelectHosts,
  type: INPUT_TYPES.TABLE,
  Table: () => HostsTable.Table,
  singleSelect: false,
  validation: array(string().trim()).default(() => undefined),
  grid: { md: 12 },
  fieldProps: {
    preserveState: true,
  },
}

const FIELDS = [EVC_MODE, HOSTS]

const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { FIELDS, SCHEMA }
