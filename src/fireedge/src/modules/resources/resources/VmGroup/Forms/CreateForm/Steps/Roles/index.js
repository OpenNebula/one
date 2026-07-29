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
import PropTypes from 'prop-types'
import { useCallback, useMemo } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Box, Stack } from '@mui/material'
import { SCHEMA, getDefaultRole } from './schema'
import RoleVmVmPanel from './rolesPanel'
import HostAffinityPanel from './hostAffinityPanel'
import RoleConfigurationPreview from './roleConfigurationPreview'
import { Group as RoleIcon } from 'iconoir-react'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { SelectableCardPanel } from '@ComponentsV2Module'
import { useSelectableCardPanel } from '@HooksModule'

export const STEP_ID = 'role-definition'

const RoleDefinitionDocumentation = () => {
  const { translate } = useTranslation()

  return (
    <Stack gap="1em">
      <Box>{translate(T.RoleDefineRoles)}</Box>
      <Box>
        {translate(T.VMAffinity)}: {translate(T.Affined)} /{' '}
        {translate(T.AntiAffined)}
      </Box>
      <Box>{translate(T.NoAffinedHostsConcept)}</Box>
      <Box>{translate(T.NoAntiAffinedHostsConcept)}</Box>
      <Box>
        <strong>{translate(T.VMGroupConfiguration)}:</strong>
        <Box component="ul" sx={{ my: 0, pl: 4 }}>
          <li>{translate(T.RoleDefineRoles)}</li>
          <li>{translate(T.RoleOptimize)}</li>
          <li>{translate(T.RoleManageApps)}</li>
        </Box>
      </Box>
    </Stack>
  )
}

const Content = () => {
  const { translate } = useTranslation()
  const { control, setValue } = useFormContext()
  const watchedRoles = useWatch({
    control,
    name: STEP_ID,
  })
  const {
    fields: roles,
    append,
    remove,
  } = useFieldArray({
    name: STEP_ID,
  })

  const {
    selectedIndex: selectedRoleIndex,
    setSelectedIndex: setSelectedRoleIndex,
    handleAdd: handleAddRole,
    handleRemove: handleRemoveRole,
  } = useSelectableCardPanel({
    items: roles,
    onAdd: () => append(getDefaultRole()),
    onRemove: remove,
  })

  const displayedRoles = useMemo(
    () =>
      roles.map((role, idx) => ({
        ...role,
        ...(watchedRoles?.[idx] ?? {}),
        id: role.id,
      })),
    [roles, watchedRoles]
  )

  const handleHostAffinityChange = useCallback(
    (affinityKey, hostIds) => {
      const existingHostIds =
        watchedRoles?.[selectedRoleIndex]?.[affinityKey] || []

      const combinedHostIds = Array.from(
        new Set([...existingHostIds, ...hostIds])
      )

      setValue(
        `${STEP_ID}.${selectedRoleIndex}.${affinityKey}`,
        combinedHostIds
      )
    },
    [selectedRoleIndex, setValue, watchedRoles]
  )

  const handleRemoveHostAffinity = useCallback(
    (affinityKey, hostId) => {
      const hostIds = watchedRoles?.[selectedRoleIndex]?.[affinityKey] ?? []
      const nextHostIds = hostIds.filter(
        (currentHostId) => String(currentHostId) !== String(hostId)
      )

      setValue(`${STEP_ID}.${selectedRoleIndex}.${affinityKey}`, nextHostIds)
    },
    [selectedRoleIndex, setValue, watchedRoles]
  )

  const newRoleLabel = translate(T.NewRole)
  const nonePolicyLabel = translate(T.None)
  const affinedPolicyLabel = translate(T.Affined)
  const antiAffinedPolicyLabel = translate(T.AntiAffined)
  const addRoleLabel = translate(T.AddRole)

  const renderRoleTitle = useCallback(
    (role) => role?.NAME || newRoleLabel,
    [newRoleLabel]
  )

  const renderRoleSubtitle = useCallback(
    (role) => {
      const policyMap = {
        AFFINED: affinedPolicyLabel,
        ANTI_AFFINED: antiAffinedPolicyLabel,
        None: nonePolicyLabel,
      }

      return policyMap[role?.POLICY] ?? nonePolicyLabel
    },
    [affinedPolicyLabel, antiAffinedPolicyLabel, nonePolicyLabel]
  )

  const selectedRole = useMemo(
    () =>
      selectedRoleIndex === null || selectedRoleIndex === undefined
        ? undefined
        : displayedRoles?.[selectedRoleIndex],
    [displayedRoles, selectedRoleIndex]
  )

  return (
    <Box sx={{ mt: 2 }}>
      <SelectableCardPanel
        items={displayedRoles}
        selectedIndex={selectedRoleIndex}
        onSelect={setSelectedRoleIndex}
        onAdd={handleAddRole}
        onRemove={handleRemoveRole}
        allowRemoveAll={false}
        addLabel={addRoleLabel}
        addButtonCy="add-role"
        getItemKey={(role, idx) => `role-${idx}-${role?.id}`}
        cardIcon={RoleIcon}
        renderCardTitle={renderRoleTitle}
        renderCardSubtitle={renderRoleSubtitle}
        sidebarSize={23}
      >
        {selectedRole && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              minWidth: 0,
              overflow: 'auto',
              width: '100%',
            }}
          >
            <RoleConfigurationPreview
              role={selectedRole}
              selectedRoleIndex={selectedRoleIndex}
              onRemoveHost={handleRemoveHostAffinity}
            />
            <Box sx={{ width: '100%' }}>
              <RoleVmVmPanel
                formId={`${STEP_ID}.${selectedRoleIndex}`}
                selectedRoleIndex={selectedRoleIndex}
              />
              <HostAffinityPanel
                roles={displayedRoles}
                selectedRoleIndex={selectedRoleIndex}
                onChange={handleHostAffinityChange}
              />
            </Box>
          </Box>
        )}
      </SelectableCardPanel>
    </Box>
  )
}

/**
 * Role definition configuration.
 *
 * @param {object} props - Step properties
 * @param {string} props.version - OpenNebula version
 * @returns {object} Roles definition configuration step
 */
const RoleDefinition = ({ version }) => ({
  id: STEP_ID,
  label: 'Role Definition',
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
  documentation: {
    title: T.RoleDefinition,
    content: RoleDefinitionDocumentation,
    link: 'product/cloud_system_administration/capacity_planning/affinity/',
    version,
  },
})
RoleDefinition.propTypes = {
  data: PropTypes.array,
  setFormData: PropTypes.func,
  version: PropTypes.string,
}

export default RoleDefinition
