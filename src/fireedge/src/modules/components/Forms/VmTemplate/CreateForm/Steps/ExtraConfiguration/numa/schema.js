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
import { ObjectSchema, boolean, lazy, number, string } from 'yup'

import {
  HYPERVISORS,
  INPUT_TYPES,
  NUMA_PIN_POLICIES,
  T,
} from '@ConstantsModule'
import {
  Field,
  arrayToOptions,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
  sentenceCase,
} from '@UtilsModule'

import { VIRTUAL_CPU as GENERAL_VIRTUAL_CPU } from '@modules/components/Forms/VmTemplate/CreateForm/Steps/General/capacitySchema'

const { kvm, dummy, lxc } = HYPERVISORS
const numaPinPolicies = Object.keys(NUMA_PIN_POLICIES)

const ENABLE_NUMA = {
  name: 'TOPOLOGY.ENABLE_NUMA',
  label: T.NumaTopology,
  type: INPUT_TYPES.CHECKBOX,
  tooltip: T.NumaTopologyConcept,
  validation: lazy((_, { context }) =>
    boolean().default(
      () =>
        !!Object.keys(context?.TEMPLATE?.TOPOLOGY ?? {})?.filter(
          (k) => !['MEMORY_ACCESS', 'HUGEPAGE_SIZE']?.includes(k)
        )?.length
    )
  ),
  grid: { md: 12 },
}

/** @type {Field} Pin policy field */
const PIN_POLICY = {
  name: 'TOPOLOGY.PIN_POLICY',
  label: T.PinPolicy,
  tooltip: [T.PinPolicyConcept, numaPinPolicies.join(', ')],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(numaPinPolicies, {
    addEmpty: false,
    getText: sentenceCase,
  }),
  dependOf: [ENABLE_NUMA.name],
  htmlType: ([enabledNuma = false] = []) => !enabledNuma && INPUT_TYPES.HIDDEN,
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .notRequired()
      .default(() => {
        const { extra } = context || {}

        return extra?.TOPOLOGY?.NODE_AFFINITY
          ? NUMA_PIN_POLICIES.NODE_AFFINITY
          : NUMA_PIN_POLICIES.NONE
      })
  ),
}

/** @type {Field} NODE_AFFINITY field */
const NODE_AFFINITY = {
  name: 'TOPOLOGY.NODE_AFFINITY',
  label: T.NodeAffinity,
  tooltip: T.NodeAffinityConcept,
  dependOf: [PIN_POLICY.name, ENABLE_NUMA.name],
  htmlType: ([pinPolicy, enabledNuma = false] = []) =>
    (!enabledNuma || pinPolicy !== NUMA_PIN_POLICIES.NODE_AFFINITY) && INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.TEXT,
  validation: lazy((_, { context }) => {
    const { extra } = context || {}

    return extra?.TOPOLOGY?.PIN_POLICY === NUMA_PIN_POLICIES.NODE_AFFINITY
      ? string().trim().required()
      : string().trim().notRequired()
  }),
}

/** @type {Field} Cores field */
const CORES = {
  name: 'TOPOLOGY.CORES',
  label: T.Cores,
  tooltip: T.NumaCoresConcept,
  dependOf: [ENABLE_NUMA.name],
  type: INPUT_TYPES.TEXT,
  htmlType: () => 'number',
  fieldProps: ([enabledNuma = false] = []) => ({
    disabled: !enabledNuma,
  }),
  validation: number()
    .notRequired()
    .integer()
    .positive()
    .default(() => 1),
}

/** @type {Field} Sockets field */
const SOCKETS = {
  name: 'TOPOLOGY.SOCKETS',
  label: T.Sockets,
  tooltip: T.NumaSocketsConcept,
  type: INPUT_TYPES.TEXT,
  dependOf: [ENABLE_NUMA.name],
  htmlType: () => 'number',
  fieldProps: ([enabledNuma = false] = []) => ({
    disabled: !enabledNuma,
  }),
  validation: number()
    .notRequired()
    .integer()
    .positive()
    .default(() => 1),
}

const emptyStringToNull = (value, originalValue) =>
  originalValue === '' ? null : value

const threadsValidation = number()
  .nullable()
  .integer()
  .positive()
  .transform(emptyStringToNull)
  .default(() => 1)

/** @type {Field} Threads field */
const THREADS = {
  name: 'TOPOLOGY.THREADS',
  label: T.Threads,
  dependOf: [ENABLE_NUMA.name],
  tooltip: T.ThreadsConcept,
  htmlType: () => 'number',
  optionsOnly: true,
  type: INPUT_TYPES.TEXT,
  validation: lazy((_) => threadsValidation),
  fieldProps: ([enabledNuma = false] = []) => ({
    disabled: !enabledNuma,
  }),
}

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @returns {Field[]} List of NUMA fields
 */
const NUMA_FIELDS = (hypervisor) =>
  filterFieldsByHypervisor(
    [ENABLE_NUMA, PIN_POLICY, NODE_AFFINITY, CORES, SOCKETS, THREADS],
    hypervisor
  )

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @returns {Field[]} List of NUMA fields
 */
const SCHEMA_FIELDS = (hypervisor) => NUMA_FIELDS(hypervisor)

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

      if ([kvm, dummy, lxc].includes(hyperv) && isEnabled) {
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

const VIRTUAL_CPU = {
  ...GENERAL_VIRTUAL_CPU,
  name: 'TOPOLOGY.NUMA_VCPU',
  dependOf: [
    SOCKETS.name,
    THREADS.name,
    CORES.name,
    '$general.VCPU',
    ENABLE_NUMA.name,
  ],
  watcher: ([s = 1, t = 1, c = 1, vcpu, numaEnabled]) =>
    numaEnabled ? s * t * c : vcpu,
  fieldProps: {
    disabled: true,
  },
}

const VCPU_SCHEMA = getObjectSchemaFromFields([VIRTUAL_CPU])

export {
  SCHEMA_FIELDS as FIELDS,
  NUMA_FIELDS,
  NUMA_SCHEMA as SCHEMA,
  VCPU_SCHEMA,
  VIRTUAL_CPU,
}
