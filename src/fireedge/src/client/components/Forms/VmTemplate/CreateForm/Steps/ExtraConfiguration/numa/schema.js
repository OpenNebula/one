/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { string, number } from 'yup'

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
} from 'client/utils'

const { vcenter, firecracker } = HYPERVISORS

const threadsValidation = number().nullable().notRequired().integer()

/**
 * @param {HYPERVISORS} hypervisor - VM hypervisor
 * @returns {Field} Pin policy field
 */
const PIN_POLICY = (hypervisor) => {
  const isVCenter = hypervisor === vcenter
  const isFirecracker = hypervisor === firecracker

  return {
    name: 'TOPOLOGY.PIN_POLICY',
    label: T.PinPolicy,
    tooltip: [T.PinPolicyConcept, NUMA_PIN_POLICIES.join(', ')],
    type: INPUT_TYPES.SELECT,
    values: arrayToOptions(NUMA_PIN_POLICIES, {
      addEmpty: false,
      getText: sentenceCase,
    }),
    validation: string()
      .trim()
      .notRequired()
      .default(
        () =>
          isFirecracker
            ? NUMA_PIN_POLICIES[2] // SHARED
            : NUMA_PIN_POLICIES[0] // NONE
      ),
    fieldProps: { disabled: isVCenter || isFirecracker },
  }
}

/**
 * @param {HYPERVISORS} hypervisor - VM hypervisor
 * @returns {Field} Cores field
 */
const CORES = (hypervisor) => ({
  name: 'TOPOLOGY.CORES',
  label: T.Cores,
  tooltip: T.NumaCoresConcept,
  dependOf: '$general.VCPU',
  type: hypervisor === vcenter ? INPUT_TYPES.SELECT : INPUT_TYPES.TEXT,
  htmlType: 'number',
  values: (vcpu) => arrayToOptions(getFactorsOfNumber(vcpu ?? 0)),
  validation: number()
    .notRequired()
    .integer()
    .default(() => undefined),
})

/**
 * @param {HYPERVISORS} hypervisor - VM hypervisor
 * @returns {Field} Sockets field
 */
const SOCKETS = (hypervisor) => ({
  name: 'TOPOLOGY.SOCKETS',
  label: T.Sockets,
  tooltip: T.NumaSocketsConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .notRequired()
    .integer()
    .default(() => 1),
  fieldProps: {
    disabled: hypervisor === firecracker,
  },
  ...(hypervisor === vcenter && {
    fieldProps: { disabled: true },
    dependOf: ['$general.VCPU', 'TOPOLOGY.CORES'],
    watcher: ([vcpu, cores] = []) => {
      if (!isNaN(+vcpu) && !isNaN(+cores) && +cores !== 0) {
        return vcpu / cores
      }
    },
  }),
})

/**
 * @param {HYPERVISORS} hypervisor - VM hypervisor
 * @returns {Field} Threads field
 */
const THREADS = (hypervisor) => ({
  name: 'TOPOLOGY.THREADS',
  label: T.Threads,
  tooltip: T.ThreadsConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: threadsValidation,
  ...(hypervisor === firecracker && {
    type: INPUT_TYPES.SELECT,
    values: arrayToOptions([1, 2]),
    validation: threadsValidation.min(1).max(2),
  }),
  ...(hypervisor === vcenter && {
    type: INPUT_TYPES.SELECT,
    values: arrayToOptions([1]),
    validation: threadsValidation.min(1).max(1),
  }),
})

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
const FIELDS = (hypervisor) =>
  filterFieldsByHypervisor(
    [PIN_POLICY, CORES, SOCKETS, THREADS, HUGEPAGES, MEMORY_ACCESS],
    hypervisor
  )

export { FIELDS }
