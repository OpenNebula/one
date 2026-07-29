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
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable react/prop-types */

import { useFieldArray, useFormContext } from 'react-hook-form'
import { Stack } from '@mui/material'
import { STEP_ID as ROLES_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles'

import { useTranslation } from '@ProvidersModule'

import { Calendar as PolicyIcon } from 'iconoir-react'

import { T } from '@ConstantsModule'
import {
  CollapsiblePanel,
  FormWithSchema,
  SelectableCardPanel,
} from '@ComponentsV2Module'
import { useSelectableCardPanel } from '@HooksModule'

import {
  SCHEDULED_POLICY_FIELDS,
  SCHED_TYPES,
  SECTION_ID,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles/dropdowns/sections/scheduled/schema'

const renderPolicyTitle = (translate) => (_, idx) =>
  `${translate(T.Policy)} #${idx}`

const renderStartTime = (startTime) => {
  if (!startTime) return undefined
  if (typeof startTime?.toFormat === 'function') return startTime.toFormat('ff')
  if (startTime instanceof Date) return startTime.toLocaleString()

  return startTime
}

const renderPolicySubtitle = (watchedPolicies, translate) => (policy, idx) => {
  const policyValues = watchedPolicies?.[idx] ?? policy
  const startTime = renderStartTime(policyValues?.start_time)

  const secondaryFields = [
    policyValues?.type &&
      `${translate(T.Type)}: ${translate(SCHED_TYPES?.[policyValues.type])}`,
    policyValues?.adjust && `${translate(T.Adjust)}: ${policyValues.adjust}`,
    policyValues?.min && `${translate(T.Min)}: ${policyValues.min}`,
    policyValues?.recurrence &&
      `${translate(T.Recurrence)}: ${policyValues.recurrence}`,
    startTime && `${translate(T.StartTime)}: ${startTime}`,
  ].filter(Boolean)

  return secondaryFields.join(' | ')
}

const ScheduledPolicies = ({ roles, selectedRole }) => {
  const { translate } = useTranslation()
  const { watch } = useFormContext()

  const wPolicies = watch(`${ROLES_ID}.${selectedRole}.${SECTION_ID}`)

  const {
    fields: policies,
    append,
    remove,
  } = useFieldArray({
    name: `${ROLES_ID}.${selectedRole}.${SECTION_ID}`,
  })

  const handleAppend = () => {
    append({
      adjust: '',
      cooldown: '',
      expression: '',
      min: '',
      period: '',
      period_number: '',
      type: '',
    })
  }

  const {
    selectedIndex: selectedPolicy,
    setSelectedIndex: setSelectedPolicy,
    handleAdd,
    handleRemove,
  } = useSelectableCardPanel({
    items: policies,
    onAdd: handleAppend,
    onRemove: remove,
  })

  return (
    <CollapsiblePanel
      key={`policies-${roles?.[selectedRole]?.id}`}
      title={T.ScheduledPolicies}
      isDefaultCollapsed={false}
    >
      <SelectableCardPanel
        items={policies}
        selectedIndex={selectedPolicy}
        onSelect={setSelectedPolicy}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel={T.AddPolicy}
        addButtonCy="roles-add-scheduled-policy"
        getItemKey={(policy, idx) => `spolicy-${idx}-${policy?.id}`}
        cardIcon={PolicyIcon}
        renderCardTitle={renderPolicyTitle(translate)}
        renderCardSubtitle={renderPolicySubtitle(wPolicies, translate)}
        sidebarPosition="bottom"
      >
        {selectedPolicy != null && wPolicies?.length > 0 && (
          <Stack
            key={`spolicy-${policies?.[selectedPolicy]?.id}`}
            direction="column"
            alignItems="flex-start"
            gap="0.5rem"
            width="100%"
          >
            <FormWithSchema
              id={`${ROLES_ID}.${selectedRole}.${SECTION_ID}.${selectedPolicy}`}
              cy={`${ROLES_ID}`}
              fields={SCHEDULED_POLICY_FIELDS}
            />
          </Stack>
        )}
      </SelectableCardPanel>
    </CollapsiblePanel>
  )
}

export const SCHEDULED = {
  Section: ScheduledPolicies,
  id: SECTION_ID,
}
