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
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { useController } from 'react-hook-form'
import { useTranslation } from '@ProvidersModule'
import { T } from '@ConstantsModule'
import { CollapsiblePanel, Dropdown, FormWithSchema } from '@ComponentsV2Module'
import { FIELDS } from './schema'

/**
 * Role Panel component for managing roles.
 *
 * @param {object} props - Component properties.
 * @param {number} props.selectedRoleIndex - Currently selected role index.
 * @param {string} props.formId - Role field path.
 * @returns {Component} The rendered component.
 */
const RoleVmVmPanel = ({ selectedRoleIndex, formId }) => {
  const { translate } = useTranslation()
  const noneLabel = translate(T.None)
  const affinedLabel = translate(T.Affined)
  const antiAffinedLabel = translate(T.AntiAffined)
  const roleDetailsLabel = translate(T.RoleDetails)
  const vmAffinityLabel = translate(T.VMAffinity)
  const policyOptions = [
    { text: noneLabel, value: 'None' },
    { text: affinedLabel, value: 'AFFINED' },
    { text: antiAffinedLabel, value: 'ANTI_AFFINED' },
  ]
  const {
    field: { value = 'None', onChange },
    fieldState: { error },
  } = useController({
    name: `${formId}.POLICY`,
    defaultValue: 'None',
  })

  return (
    <CollapsiblePanel
      title={roleDetailsLabel}
      isDefaultCollapsed={false}
      summaryProps={{ 'data-cy': 'accordion-role-details' }}
      contentProps={{ 'data-cy': 'role-details-panel' }}
    >
      <FormWithSchema
        id={formId}
        cy={`role-definition-${selectedRoleIndex}`}
        fields={FIELDS}
        rootProps={{ sx: { mt: 2 } }}
        gridContainerSx={{ rowGap: 2 }}
      />
      <Box sx={{ mt: 2 }}>
        <Dropdown
          label={vmAffinityLabel}
          initialValue={policyOptions.find((option) => option.value === value)}
          onChange={(option) => onChange(option?.value ?? 'None')}
          options={policyOptions}
          placeholder={noneLabel}
          error={error?.message}
        />
      </Box>
    </CollapsiblePanel>
  )
}

RoleVmVmPanel.propTypes = {
  selectedRoleIndex: PropTypes.number,
  formId: PropTypes.string.isRequired,
}

export default RoleVmVmPanel
