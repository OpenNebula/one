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

import { GraphUp as PolicyIcon } from 'iconoir-react'

import { T } from '@ConstantsModule'
import {
  CollapsiblePanel,
  FormWithSchema,
  SelectableCardPanel,
} from '@ComponentsV2Module'
import { useSelectableCardPanel } from '@HooksModule'

import {
  ELASTICITY_POLICY_FIELDS,
  ELASTICITY_TYPES,
  SECTION_ID,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles/dropdowns/sections/elasticity/schema'

const renderPolicyTitle = (translate) => (_, idx) =>
  `${translate(T.Policy)} #${idx}`

const renderPolicySubtitle = (watchedPolicies, translate) => (policy, idx) => {
  const policyValues = watchedPolicies?.[idx] ?? policy

  const secondaryFields = [
    policyValues?.type &&
      `${translate(T.Type)}: ${translate(
        ELASTICITY_TYPES?.[policyValues.type]
      )}`,
    policyValues?.adjust && `${translate(T.Adjust)}: ${policyValues.adjust}`,
    policyValues?.min && `${translate(T.Min)}: ${policyValues.min}`,
    policyValues?.cooldown &&
      `${translate(T.Cooldown)}: ${policyValues.cooldown}`,
    policyValues?.period && `${translate(T.Period)}: ${policyValues.period}`,
    policyValues?.period_number && `#: ${policyValues.period_number}`,
    policyValues?.expression &&
      `${translate(T.Expression)}: ${policyValues.expression}`,
  ].filter(Boolean)

  return secondaryFields.join(' | ')
}

const ElasticityPolicies = ({ roles, selectedRole }) => {
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
      title={T.ElasticityPolicies}
      isDefaultCollapsed={false}
    >
      <SelectableCardPanel
        items={policies}
        selectedIndex={selectedPolicy}
        onSelect={setSelectedPolicy}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel={T.AddPolicy}
        addButtonCy="roles-add-elastic-policy"
        getItemKey={(policy, idx) => `epolicy-${idx}-${policy?.id}`}
        cardIcon={PolicyIcon}
        renderCardTitle={renderPolicyTitle(translate)}
        renderCardSubtitle={renderPolicySubtitle(wPolicies, translate)}
        sidebarPosition="bottom"
      >
        {selectedPolicy != null && wPolicies?.length > 0 && (
          <Stack
            key={`epolicy-${policies?.[selectedPolicy]?.id}`}
            direction="column"
            alignItems="flex-start"
            gap="0.5rem"
            width="100%"
          >
            <FormWithSchema
              id={`${ROLES_ID}.${selectedRole}.${SECTION_ID}.${selectedPolicy}`}
              cy={`${ROLES_ID}`}
              fields={ELASTICITY_POLICY_FIELDS}
            />
          </Stack>
        )}
      </SelectableCardPanel>
    </CollapsiblePanel>
  )
}

export const ELASTICITY = {
  Section: ElasticityPolicies,
  id: SECTION_ID,
}
