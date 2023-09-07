/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { ObjectSchema, boolean, lazy, number, string } from 'yup'

import {
  HYPERVISORS,
  INPUT_TYPES,
  NUMA_MEMORY_ACCESS,
  NUMA_PIN_POLICIES,
  T,
} from 'client/constants'
import { useGetHostsQuery } from 'client/features/OneApi/host'
import { getHugepageSizes } from 'client/models/Host'
import {
  Field,
  arrayToOptions,
  filterFieldsByHypervisor,
  getFactorsOfNumber,
  getObjectSchemaFromFields,
  prettyBytes,
  sentenceCase,
} from 'client/utils'

const { kvm, vcenter, firecracker, dummy } = HYPERVISORS
const numaPinPolicies = Object.keys(NUMA_PIN_POLICIES)

const ENABLE_NUMA = {
  name: 'TOPOLOGY.ENABLE_NUMA',
  label: T.NumaTopology,
  type: INPUT_TYPES.CHECKBOX,
  tooltip: T.NumaTopologyConcept,
  validation: lazy((_, { context }) =>
    boolean().default(() => !!context?.TEMPLATE?.TOPOLOGY)
  ),
  grid: { md: 12 },
}

/** @type {Field} Pin policy field */
const PIN_POLICY = {
  name: 'TOPOLOGY.PIN_POLICY',
  label: T.PinPolicy,
  tooltip: [T.PinPolicyConcept, numaPinPolicies.join(', ')],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(numaPinPolicies, {
    addEmpty: false,
    getText: sentenceCase,
  }),
  dependOf: '$general.HYPERVISOR',
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .notRequired()
      .default(() => {
        const { general, extra } = context || {}

        return general?.HYPERVISOR === firecracker
          ? NUMA_PIN_POLICIES.SHARED
          : ![vcenter].includes(general?.HYPERVISOR) &&
            extra?.TOPOLOGY?.NODE_AFFINITY
          ? NUMA_PIN_POLICIES.NODE_AFFINITY
          : NUMA_PIN_POLICIES.NONE
      })
  ),
  fieldProps: (hypervisor) => ({
    disabled: [vcenter, firecracker].includes(hypervisor),
  }),
}

/** @type {Field} NODE_AFFINITY field */
const NODE_AFFINITY = {
  name: 'TOPOLOGY.NODE_AFFINITY',
  label: T.NodeAffinity,
  tooltip: T.NodeAffinityConcept,
  dependOf: ['$general.HYPERVISOR', PIN_POLICY.name],
  type: INPUT_TYPES.TEXT,
  htmlType: (_, context) => {
    const values = context?.getValues() || {}
    const { general, extra } = values || {}

    return ![vcenter, firecracker].includes(general?.HYPERVISOR) &&
      extra?.TOPOLOGY?.PIN_POLICY === NUMA_PIN_POLICIES.NODE_AFFINITY
      ? 'number'
      : INPUT_TYPES.HIDDEN
  },
  validation: lazy((_, { context }) => {
    const { general, extra } = context || {}

    return ![vcenter, firecracker].includes(general?.HYPERVISOR) &&
      extra?.TOPOLOGY?.PIN_POLICY === NUMA_PIN_POLICIES.NODE_AFFINITY
      ? string().trim().required()
      : string().trim().notRequired()
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
    [
      PIN_POLICY,
      NODE_AFFINITY,
      CORES,
      SOCKETS,
      THREADS,
      HUGEPAGES,
      MEMORY_ACCESS,
    ],
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
  getObjectSchemaFromFields(SCHEMA_FIELDS(hypervisor)).afterSubmit(
    (result, { context }) => {
      const { TOPOLOGY, ...ensuredResult } = result
      const { ENABLE_NUMA: isEnabled, ...restOfTopology } = TOPOLOGY
      const hyperv = context?.general?.HYPERVISOR

      if ([vcenter, kvm, dummy].includes(hyperv) && isEnabled) {
        if (
          restOfTopology?.NODE_AFFINITY &&
          restOfTopology.PIN_POLICY === NUMA_PIN_POLICIES.NODE_AFFINITY
        ) {
          delete restOfTopology.PIN_POLICY
        } else {
          delete restOfTopology.NODE_AFFINITY
        }
        ensuredResult.TOPOLOGY = { ...restOfTopology }
      }

      return { ...ensuredResult }
    }
  )

export {
  ENABLE_NUMA,
  SCHEMA_FIELDS as FIELDS,
  NUMA_FIELDS,
  NUMA_SCHEMA as SCHEMA,
}
