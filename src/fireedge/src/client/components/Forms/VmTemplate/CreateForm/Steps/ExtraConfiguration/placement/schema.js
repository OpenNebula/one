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
import { string } from 'yup'

import { Field, Section, disableFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'
import { transformXmlString } from 'client/models/Helper'

/**
 * Add or replace the hypervisor type in SCHED_REQUIREMENTS attribute.
 *
 * @param {string} schedRequirements - Actual value
 * @param {string} hypervisor - Value of the hypervisor
 * @returns {string} - The result after replace or add the new hypervsior
 */
const addHypervisorRequirement = (schedRequirements, hypervisor) => {
  // Regular expression pattern to match (HYPERVISOR=VALUE)
  const regexPattern = /\(HYPERVISOR=(kvm|dummy|lxc|vcenter|firecracker|qemu)\)/

  // If exists a condition with hypervisor, replace the type. If not, add the hypervisor type.
  if (regexPattern.test(schedRequirements)) {
    // Replace the matched pattern with the new hypervisor
    return schedRequirements.replace(
      regexPattern,
      '(HYPERVISOR=' + hypervisor + ')'
    )
  } else {
    // Add the condition only
    return schedRequirements
      ? `(${schedRequirements}) & (HYPERVISOR=${hypervisor})`
      : `(HYPERVISOR=${hypervisor})`
  }
}

/** @type {Field} Host requirement field */
const HOST_REQ_FIELD = (isUpdate, modifiedFields, instantiate) => ({
  name: 'SCHED_REQUIREMENTS',
  label: T.HostReqExpression,
  tooltip: T.HostReqExpressionConcept,
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.HYPERVISOR',
  watcher: (hypervisor, { formContext }) => {
    // Value of SCHED_REQUIREMENTS
    const actualValue = formContext.getValues('extra.SCHED_REQUIREMENTS')

    // Check if the hypervisor was changed by the user
    const hypervisorHasChanged = modifiedFields?.general?.HYPERVISOR

    // Add condition only if the hypervisor was changed by the user or if we are in the create form
    if (hypervisorHasChanged || !isUpdate) {
      // Return SCHED_REQUIREMENTS with the condition of hypervisor
      return addHypervisorRequirement(actualValue, hypervisor)
    } else {
      // Return SCHED_REQUIREMENTS without the condition of hypervisor
      return actualValue
    }
  },
  validation: string()
    .trim()
    .notRequired()
    .afterSubmit((value, { context }) => {
      // After submit case exists because if the user don't enter on Placement section, the watcher function will not be executed

      // Instantiate not use default values
      if (instantiate) return transformXmlString(value)

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
        const result = addHypervisorRequirement(
          value,
          context.general.HYPERVISOR
        )

        return transformXmlString(result)
      } else {
        return transformXmlString(value)
      }
    }),
})

/** @type {Field} Host rank requirement field */
const HOST_RANK_FIELD = {
  name: 'SCHED_RANK',
  label: T.HostPolicyExpression,
  tooltip: T.HostPolicyExpressionConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
}

/** @type {Field} Datastore requirement field */
const DS_REQ_FIELD = {
  name: 'SCHED_DS_REQUIREMENTS',
  label: T.DatastoreReqExpression,
  tooltip: T.DatastoreReqExpressionConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
}

/** @type {Field} Datastore rank requirement field */
const DS_RANK_FIELD = {
  name: 'SCHED_DS_RANK',
  label: T.DatastorePolicyExpression,
  tooltip: T.DatastorePolicyExpressionConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
}

/** @type {Section[]} Sections */
const SECTIONS = (oneConfig, adminGroup, isUpdate, modifiedFields) => [
  {
    id: 'placement-host',
    legend: T.Host,
    fields: disableFields(
      [HOST_REQ_FIELD(isUpdate, modifiedFields), HOST_RANK_FIELD],
      '',
      oneConfig,
      adminGroup
    ),
  },
  {
    id: 'placement-ds',
    legend: T.Datastore,
    fields: disableFields(
      [DS_REQ_FIELD, DS_RANK_FIELD],
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
