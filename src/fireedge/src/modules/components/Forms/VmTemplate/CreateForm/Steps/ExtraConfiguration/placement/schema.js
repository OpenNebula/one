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
import { string, array } from 'yup'

import { Field, Section, arrayToOptions, disableFields } from '@UtilsModule'
import {
  ClustersTable,
  HostsTable,
  DatastoresTable,
} from '@modules/components/Tables'
import { T, INPUT_TYPES } from '@ConstantsModule'

/**
 * Add or replace the hypervisor type in SCHED_REQUIREMENTS attribute.
 *
 * @param {string} schedRequirements - Actual value
 * @param {string} hypervisor - Value of the hypervisor
 * @returns {string} - The result after replace or add the new hypervsior
 */
const addHypervisorRequirement = (schedRequirements, hypervisor) => {
  // Regular expression pattern to match (HYPERVISOR=VALUE)

  const regexPattern = /HYPERVISOR=(kvm|dummy|lxc|qemu)/

  // If exists a condition with hypervisor, replace the type. If not, add the hypervisor type.
  if (regexPattern.test(schedRequirements)) {
    // Replace the matched pattern with the new hypervisor
    return schedRequirements.replace(regexPattern, 'HYPERVISOR=' + hypervisor)
  } else {
    // Add the condition only
    if (!hypervisor) {
      return `${schedRequirements}`
    }

    return schedRequirements
      ? `HYPERVISOR=${hypervisor} & ${schedRequirements}`
      : `HYPERVISOR=${hypervisor}`
  }
}

/** @type {Field} Host requirement field */
const HOST_REQ_FIELD = (isUpdate, modifiedFields, instantiate) => ({
  name: 'SCHED_REQUIREMENTS',
  label: T.HostReqExpression,
  tooltip: T.HostReqExpressionConcept,
  type: INPUT_TYPES.TEXT,
  dependOf: [
    '$general.HYPERVISOR',
    '$extra.PLACEMENT_CLUSTER_TABLE',
    '$extra.PLACEMENT_HOST_TABLE',
    '$extra.CLUSTER_HOST_TYPE',
  ],

  watcher: (dependencies, { formContext }) => {
    const [hypervisor, clusterTable, hostTable, clusterHostType] = dependencies

    const clusterHostTable = clusterHostType?.includes(T.Cluster)
      ? clusterTable
      : hostTable

    const tableType = clusterHostType?.includes(T.Cluster) ? 'CLUSTER_' : ''
    const regexPattern = new RegExp(`\\b${tableType}ID\\s*=\\s*\\d+`)

    const actualValue = formContext.getValues('extra.SCHED_REQUIREMENTS')

    const parts = actualValue
      ?.split('&')
      ?.flatMap((part) => part.split('|'))
      ?.map((part) => part?.trim())

    const matchedParts = parts?.filter((part) => regexPattern.test(part))
    const nonMatchedParts = parts?.filter((part) => !regexPattern.test(part))

    const matchedIDs = matchedParts
      ?.map((part) => part.match(/\d+/)?.[0])
      ?.filter(Boolean)

    const remainingIDs =
      clusterHostTable?.filter((id) => matchedIDs?.includes(id)) ?? []

    const filteredMatchedParts = matchedParts?.filter((part) => {
      const idMatch = part.match(/\d+/)
      const id = idMatch ? idMatch[0] : null

      return id && remainingIDs?.includes(id) && part?.includes(tableType)
    })

    const newExpressions = clusterHostTable
      ?.filter((id) => !remainingIDs.includes(id))
      .map((id) => `${tableType}ID = ${id}`)

    const updatedParts = [
      ...(nonMatchedParts ?? []),
      ...(filteredMatchedParts ?? []),
      ...(newExpressions ?? []),
    ]

    const updatedPartsWithoutHypervisor = updatedParts.filter(
      (part) => !part.includes('HYPERVISOR=')
    )

    const hypervisorCondition =
      updatedParts.find((part) => part.includes('HYPERVISOR=')) ??
      (hypervisor && `HYPERVISOR=${hypervisor}`)

    const updatedValue =
      updatedPartsWithoutHypervisor.length > 0
        ? hypervisorCondition
          ? `${hypervisorCondition} & ${updatedPartsWithoutHypervisor.join(
              ' | '
            )}`
          : `${updatedPartsWithoutHypervisor.join(' | ')}`
        : hypervisorCondition

    const hasHypervisorCondition = actualValue?.includes(
      `HYPERVISOR=${hypervisor}`
    )

    // Add the hypervisor condition only if it doesn't exist
    let finalValue = updatedValue
    if ((!hasHypervisorCondition || !isUpdate) && hypervisor) {
      finalValue = addHypervisorRequirement(updatedValue, hypervisor)
    }

    return finalValue
  },
  validation: string()
    .trim()
    .notRequired()
    .afterSubmit((value, { context }) => {
      // After submit case exists because if the user don't enter on Placement section, the watcher function will not be executed

      // Instantiate not use default values
      if (instantiate) return value

      // Check if SCHED_REQUIREMENTS was changed by the user
      const schedRequirementsHasChanged =
        modifiedFields?.extra?.Placement?.SCHED_REQUIREMENTS

      // Check if the hypervisor was change by the user
      const hypervisorHasChanged = modifiedFields?.general?.HYPERVISOR

      // Replace or add hyperviosr condition
      if (
        (!isUpdate && !schedRequirementsHasChanged) ||
        (isUpdate && hypervisorHasChanged && !schedRequirementsHasChanged)
      ) {
        return addHypervisorRequirement(value, context.general.HYPERVISOR)
      }

      return value
    }),
  grid: { xs: 12, md: 12 },
})

/** @type {Field} Host policy type field */
const HOST_POLICY_TYPE_FIELD = {
  name: 'HOST_POLICY_TYPE',
  type: INPUT_TYPES.TOGGLE,
  values: () =>
    arrayToOptions([T.Packing, T.Stripping, T.LoadAware], {
      addEmpty: false,
      getText: (opt) => opt,
      getValue: (_opt, idx) =>
        ['RUNNING_VMS', '-RUNNING_VMS', 'FREE_CPU']?.[idx] ?? '',
    }),
  validation: string().trim().notRequired(),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} DS policy type field */
const DS_POLICY_TYPE_FIELD = {
  name: 'DS_POLICY_TYPE',
  type: INPUT_TYPES.TOGGLE,
  values: () =>
    arrayToOptions(['Packing', 'Stripping'], {
      addEmpty: false,
      getText: (opt) => opt,
      getValue: (_opt, idx) => ['-FREE_MB', 'FREE_MB']?.[idx] ?? '',
    }),
  validation: string().trim().notRequired(),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Host rank requirement field */
const HOST_RANK_FIELD = {
  name: 'SCHED_RANK',
  label: T.HostPolicyExpression,
  dependOf: 'HOST_POLICY_TYPE',
  tooltip: T.HostPolicyExpressionConcept,
  type: INPUT_TYPES.TEXT,
  watcher: (hostPolicyType) => `${hostPolicyType} `,
  validation: string().trim().notRequired(),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Datastore requirement field */
const DS_REQ_FIELD = {
  dependOf: 'DS_TABLE',
  name: 'SCHED_DS_REQUIREMENTS',
  label: T.DatastoreReqExpression,
  tooltip: T.DatastoreReqExpressionConcept,
  watcher: (dsArray) => dsArray?.map((ds) => `ID="${ds}"`).join('|'),
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Datastore rank requirement field */
const DS_RANK_FIELD = {
  name: 'SCHED_DS_RANK',
  dependOf: 'DS_POLICY_TYPE',
  label: T.DatastorePolicyExpression,
  watcher: (dsPolicyType) => `${dsPolicyType} `,
  tooltip: T.DatastorePolicyExpressionConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Type field */
const TABLE_TYPE = {
  name: 'CLUSTER_HOST_TYPE',
  type: INPUT_TYPES.TOGGLE,
  values: arrayToOptions([T.SelectCluster, T.SelectHost], {
    addEmpty: false,
  }),
  validation: string()
    .trim()
    .required()
    .default(() => T.SelectCluster),
  notNull: true,
  defaultValue: T.SelectCluster,
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Cluster selection field */
const CLUSTER_TABLE = {
  name: 'PLACEMENT_CLUSTER_TABLE',
  dependOf: 'CLUSTER_HOST_TYPE',
  type: INPUT_TYPES.TABLE,
  Table: ClustersTable.Table,
  htmlType: (tableType) =>
    !tableType?.includes(T.Cluster) && INPUT_TYPES.HIDDEN,
  singleSelect: false,
  fieldProps: {
    preserveState: true,
  },
  validation: array(string().trim())
    .required()
    .default(() => undefined),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Cluster selection field */
const HOST_TABLE = {
  name: 'PLACEMENT_HOST_TABLE',
  dependOf: 'CLUSTER_HOST_TYPE',
  type: INPUT_TYPES.TABLE,
  Table: HostsTable.Table,
  htmlType: (tableType) => !tableType?.includes(T.Host) && INPUT_TYPES.HIDDEN,
  singleSelect: false,
  fieldProps: {
    preserveState: true,
  },
  validation: array(string().trim())
    .required()
    .default(() => undefined),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Cluster selection field */
const DS_TABLE = {
  name: 'DS_TABLE',
  type: INPUT_TYPES.TABLE,
  Table: () => DatastoresTable.Table,
  singleSelect: false,
  fieldProps: {
    preserveState: true,
  },
  validation: array(string().trim())
    .required()
    .default(() => undefined),
  grid: { xs: 12, md: 12 },
}

/** @type {Section[]} Sections */
const SECTIONS = (oneConfig, adminGroup, isUpdate, modifiedFields) => [
  {
    id: 'placement-host',
    legend: T.HostRequirements,
    fields: disableFields(
      [
        TABLE_TYPE,
        CLUSTER_TABLE,
        HOST_TABLE,
        HOST_REQ_FIELD(isUpdate, modifiedFields),
        HOST_POLICY_TYPE_FIELD,
        HOST_RANK_FIELD,
      ],
      '',
      oneConfig,
      adminGroup
    ),
  },
  {
    id: 'placement-ds',
    legend: T.DatastoreRequirements,
    fields: disableFields(
      [DS_TABLE, DS_REQ_FIELD, DS_POLICY_TYPE_FIELD, DS_RANK_FIELD],
      '',
      oneConfig,
      adminGroup
    ),
  },
]

/** @type {Field[]} List of Placement fields */
const FIELDS = ({ isUpdate, modifiedFields, instantiate }) => [
  HOST_REQ_FIELD(isUpdate, modifiedFields, instantiate),
  HOST_RANK_FIELD,
  DS_REQ_FIELD,
  DS_RANK_FIELD,
]

export { SECTIONS, FIELDS }
