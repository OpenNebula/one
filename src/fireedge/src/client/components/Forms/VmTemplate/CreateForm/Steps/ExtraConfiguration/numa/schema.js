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
import { string, number, boolean, lazy, ObjectSchema } from 'yup'

import { useGetHostsQuery } from 'client/features/OneApi/host'
import { getHugepageSizes } from 'client/models/Host'
import {
  T,
  INPUT_TYPES,
  NUMA_PIN_POLICIES,
  NUMA_MEMORY_ACCESS,
  HYPERVISORS,
} from 'client/constants'
import {
  Field,
  filterFieldsByHypervisor,
  getFactorsOfNumber,
  sentenceCase,
  prettyBytes,
  arrayToOptions,
  getObjectSchemaFromFields,
} from 'client/utils'

const { vcenter, firecracker } = HYPERVISORS

const ENABLE_NUMA = {
  name: 'TOPOLOGY.ENABLE_NUMA',
  label: T.NumaTopology,
  type: INPUT_TYPES.CHECKBOX,
  tooltip: T.NumaTopologyConcept,
  validation: lazy((_, { context }) =>
    boolean().default(() => !!context?.extra?.TOPOLOGY)
  ),
  grid: { md: 12 },
}

/** @type {Field} Pin policy field */
const PIN_POLICY = {
  name: 'TOPOLOGY.PIN_POLICY',
  label: T.PinPolicy,
  tooltip: [T.PinPolicyConcept, NUMA_PIN_POLICIES.join(', ')],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(NUMA_PIN_POLICIES, {
    addEmpty: false,
    getText: sentenceCase,
  }),
  dependOf: '$general.HYPERVISOR',
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .notRequired()
      .default(
        () =>
          context?.general?.HYPERVISOR === firecracker
            ? NUMA_PIN_POLICIES[2] // SHARED
            : NUMA_PIN_POLICIES[0] // NONE
      )
  ),
  fieldProps: (hypervisor) => ({
    disabled: [vcenter, firecracker].includes(hypervisor),
  }),
}

/** @type {Field} Cores field */
const CORES = {
  name: 'TOPOLOGY.CORES',
  label: T.Cores,
  tooltip: T.NumaCoresConcept,
  dependOf: ['$general.VCPU', '$general.HYPERVISOR'],
  type: ([, hypervisor] = []) =>
    hypervisor === vcenter ? INPUT_TYPES.SELECT : INPUT_TYPES.TEXT,
  htmlType: 'number',
  values: ([vcpu] = []) => arrayToOptions(getFactorsOfNumber(vcpu ?? 0)),
  validation: number()
    .notRequired()
    .integer()
    .default(() => undefined),
}

/** @type {Field} Sockets field */
const SOCKETS = {
  name: 'TOPOLOGY.SOCKETS',
  label: T.Sockets,
  tooltip: T.NumaSocketsConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  dependOf: ['$general.HYPERVISOR', '$general.VCPU', 'TOPOLOGY.CORES'],
  validation: number()
    .notRequired()
    .integer()
    .default(() => 1),
  fieldProps: (hypervisor) => ({
    disabled: [vcenter, firecracker].includes(hypervisor),
  }),
  watcher: ([hypervisor, vcpu, cores] = []) => {
    if (hypervisor === vcenter) return

    if (!isNaN(+vcpu) && !isNaN(+cores) && +cores !== 0) {
      return vcpu / cores
    }
  },
}

const emptyStringToNull = (value, originalValue) =>
  originalValue === '' ? null : value

const threadsValidation = number()
  .nullable()
  .integer()
  .transform(emptyStringToNull)

/** @type {Field} Threads field */
const THREADS = {
  name: 'TOPOLOGY.THREADS',
  label: T.Threads,
  tooltip: T.ThreadsConcept,
  htmlType: 'number',
  dependOf: '$general.HYPERVISOR',
  type: (hypervisor) =>
    [firecracker, vcenter].includes(hypervisor)
      ? INPUT_TYPES.SELECT
      : INPUT_TYPES.TEXT,
  values: (hypervisor) =>
    ({
      [firecracker]: arrayToOptions([1, 2]),
      [vcenter]: arrayToOptions([1]),
    }[hypervisor]),
  validation: lazy(
    (_, { context }) =>
      ({
        [firecracker]: threadsValidation.min(1).max(2),
        [vcenter]: threadsValidation.min(1).max(1),
      }[context?.general?.HYPERVISOR] || threadsValidation)
  ),
}

/** @type {Field} Hugepage size field */
const HUGEPAGES = {
  name: 'TOPOLOGY.HUGEPAGE_SIZE',
  label: T.HugepagesSize,
  tooltip: T.HugepagesSizeConcept,
  notOnHypervisors: [vcenter, firecracker],
  type: INPUT_TYPES.SELECT,
  values: () => {
    const { data: hosts = [] } = useGetHostsQuery()
    const sizes = hosts
      .reduce((res, host) => res.concat(getHugepageSizes(host)), [])
      .flat()

    return arrayToOptions([...new Set(sizes)], {
      getText: (size) => prettyBytes(+size),
    })
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @returns {Field} Memory access field */
const MEMORY_ACCESS = {
  name: 'TOPOLOGY.MEMORY_ACCESS',
  label: T.MemoryAccess,
  tooltip: [T.MemoryAccessConcept, NUMA_MEMORY_ACCESS.join(', ')],
  notOnHypervisors: [vcenter, firecracker],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(NUMA_MEMORY_ACCESS, { getText: sentenceCase }),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @returns {Field[]} List of NUMA fields
 */
const NUMA_FIELDS = (hypervisor) =>
  filterFieldsByHypervisor(
    [PIN_POLICY, CORES, SOCKETS, THREADS, HUGEPAGES, MEMORY_ACCESS],
    hypervisor
  )

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @returns {Field[]} List of NUMA fields
 */
const SCHEMA_FIELDS = (hypervisor) => [ENABLE_NUMA, ...NUMA_FIELDS(hypervisor)]

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @returns {ObjectSchema} Schema for NUMA fields
 */
const NUMA_SCHEMA = (hypervisor) =>
  getObjectSchemaFromFields(SCHEMA_FIELDS(hypervisor)).afterSubmit((result) => {
    const { TOPOLOGY, ...ensuredResult } = result
    const { ENABLE_NUMA: isEnabled, ...restOfTopology } = TOPOLOGY

    isEnabled && (ensuredResult.TOPOLOGY = { ...restOfTopology })

    return { ...ensuredResult }
  })

export {
  NUMA_FIELDS,
  SCHEMA_FIELDS as FIELDS,
  NUMA_SCHEMA as SCHEMA,
  ENABLE_NUMA,
}
