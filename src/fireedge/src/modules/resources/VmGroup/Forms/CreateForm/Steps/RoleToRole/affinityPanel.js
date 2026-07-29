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
import { Component, useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Stack } from '@mui/material'
import { Group, Plus } from 'iconoir-react'
import { AffinityGroup } from './affinityGroup'
import { useTranslation } from '@ProvidersModule'
import { T } from '@ConstantsModule'
import { Button, Checkbox } from '@ComponentsV2Module'

const GROUP_TYPES = {
  AFFINED: {
    addLabel: 'Add affined group',
    createTitle: 'Select roles to place together',
    description: T.AffinedGroupsDescription,
    emptyText:
      'Group roles that exchange data so they share a host and communicate faster.',
    emptyTitle: 'No affined groups yet',
    policy: 'AFFINED',
    title: T.AffinedGroups,
    useCases: [
      T.AffinedGroupsPotentialCase1,
      T.AffinedGroupsPotentialCase2,
      T.AffinedGroupsPotentialCase3,
    ],
  },
  ANTI_AFFINED: {
    addLabel: 'Add anti-affined group',
    createTitle: 'Select roles to place apart',
    description: T.AntiAffinedGroupsDescription,
    emptyText:
      'Separate roles across hosts to reduce shared failure points and resource contention.',
    emptyTitle: 'No anti-affined groups yet',
    policy: 'ANTI_AFFINED',
    title: T.AntiAffinedGroups,
    useCases: [
      T.AntiAffinedGroupsPotentialCase1,
      T.AntiAffinedGroupsPotentialCase2,
      T.AntiAffinedGroupsPotentialCase3,
    ],
  },
}

const getTitleStyles = (theme) => ({
  color: 'text.headings',
  fontSize: {
    xs: theme.fontSize.body.md.mobile,
    sm: theme.fontSize.body.md.tablet,
    md: theme.fontSize.body.md.desktop,
  },
  fontWeight: {
    xs: theme.fontWeight.heading.h6.mobile,
    sm: theme.fontWeight.heading.h6.tablet,
    md: theme.fontWeight.heading.h6.desktop,
  },
  lineHeight: {
    xs: theme.lineHeight.body.md.mobile,
    sm: theme.lineHeight.body.md.tablet,
    md: theme.lineHeight.body.md.desktop,
  },
})

const getSubtitleStyles = (theme) => ({
  color: 'text.disabled',
  fontSize: {
    xs: theme.fontSize.body.sm.mobile,
    sm: theme.fontSize.body.sm.tablet,
    md: theme.fontSize.body.sm.desktop,
  },
  fontWeight: {
    xs: theme.fontWeight.body.sm.mobile,
    sm: theme.fontWeight.body.sm.tablet,
    md: theme.fontWeight.body.sm.desktop,
  },
  lineHeight: {
    xs: theme.lineHeight.body.sm.mobile,
    sm: theme.lineHeight.body.sm.tablet,
    md: theme.lineHeight.body.sm.desktop,
  },
})

const areGroupsEqual = (left = [], right = []) =>
  JSON.stringify(left ?? []) === JSON.stringify(right ?? [])

const getEligibleRoles = (roles = [], policy) =>
  (Array.isArray(roles) ? roles : []).filter(
    (role) =>
      role?.NAME &&
      String(role.NAME).trim().length > 0 &&
      ['None', policy].includes(role?.POLICY ?? 'None')
  )

const sanitizeGroups = (groups = [], roles = [], policy) => {
  const policyByRole = Object.fromEntries(
    (Array.isArray(roles) ? roles : [])
      .filter((role) => role?.NAME)
      .map((role) => [role.NAME, role.POLICY])
  )

  return (Array.isArray(groups) ? groups : [])
    .map((group) => {
      const roleGroup = Array.isArray(group) ? group : []

      return roleGroup.filter((roleName) =>
        ['None', policy].includes(policyByRole[roleName] ?? 'None')
      )
    })
    .filter((group) => group?.length >= 2)
}

/**
 * Role selection panel used before creating an affinity group.
 *
 * @param {object} props - Component props
 * @param {Array} props.roles - Selectable roles
 * @param {Array} props.selectedRoles - Selected role names
 * @param {string} props.title - Selection title
 * @param {Function} props.onToggleRole - Role toggle handler
 * @param {Function} props.onCreate - Group create handler
 * @param {Function} props.onCancel - Cancel handler
 * @returns {Component} Group builder
 */
const GroupBuilder = ({
  roles = [],
  selectedRoles = [],
  title,
  onToggleRole,
  onCreate,
  onCancel,
}) => {
  const { translate } = useTranslation()
  const hasEnoughRoles = selectedRoles.length >= 2

  return (
    <Box
      sx={(theme) => ({
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.action}`,
        borderRadius: `${theme.borderRadius.xlg}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
      })}
    >
      <Box sx={getTitleStyles}>{title}</Box>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {roles.map((role) => (
          <Box
            key={role.NAME}
            sx={(theme) => ({
              alignItems: 'center',
              border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
              borderRadius: `${theme.borderRadius.xlg}px`,
              display: 'flex',
              minHeight: 42,
              px: 1.5,
              py: 0.75,
              '& .checkbox-container': {
                gap: `${theme.scale[300]}px`,
              },
            })}
          >
            <Checkbox
              checked={selectedRoles.includes(role.NAME)}
              onChange={() => onToggleRole(role.NAME)}
              text={role.NAME}
              value={role.NAME}
            />
          </Box>
        ))}
      </Stack>
      <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1.5}>
        <Button
          isDisabled={!hasEnoughRoles}
          onClick={onCreate}
          size="small"
          startIcon={<Plus width="16px" height="16px" />}
          type="secondary"
        >
          {translate(T.AddGroup)}
        </Button>
        <Button onClick={onCancel} size="small" type="secondary">
          {translate(T.Cancel)}
        </Button>
        {!hasEnoughRoles && (
          <Box
            sx={(theme) => ({
              ...getSubtitleStyles(theme),
              flex: '1 1 12rem',
            })}
          >
            Pick at least 2 roles.
          </Box>
        )}
      </Stack>
    </Box>
  )
}

GroupBuilder.propTypes = {
  roles: PropTypes.array,
  selectedRoles: PropTypes.array,
  title: PropTypes.string,
  onToggleRole: PropTypes.func,
  onCreate: PropTypes.func,
  onCancel: PropTypes.func,
}

/**
 * Affinity card for one role-to-role group type.
 *
 * @param {object} props - Component props
 * @param {string} props.type - Group type
 * @param {Array} props.roles - All roles
 * @param {Array} props.groups - Current groups
 * @param {boolean} props.isBuilderOpen - Builder visibility
 * @param {Array} props.selectedRoles - Selected role names
 * @param {Function} props.onOpenBuilder - Open builder handler
 * @param {Function} props.onCancelBuilder - Cancel builder handler
 * @param {Function} props.onToggleRole - Role toggle handler
 * @param {Function} props.onCreateGroup - Create group handler
 * @param {Function} props.onDeleteGroup - Delete group handler
 * @param {Function} props.onDeleteRole - Delete role handler
 * @returns {Component} Affinity card
 */
const AffinityCard = ({
  type,
  roles,
  groups,
  isBuilderOpen,
  selectedRoles,
  onOpenBuilder,
  onCancelBuilder,
  onToggleRole,
  onCreateGroup,
  onDeleteGroup,
  onDeleteRole,
}) => {
  const { translate } = useTranslation()
  const config = GROUP_TYPES[type]
  const eligibleRoles = useMemo(
    () => getEligibleRoles(roles, config.policy),
    [config.policy, roles]
  )
  const canOpenBuilder = eligibleRoles.length >= 2

  return (
    <Box
      sx={(theme) => ({
        bgcolor: 'surface.primary',
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        borderRadius: `${theme.borderRadius['2xl']}px`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 420,
        overflow: 'hidden',
      })}
    >
      <Box
        sx={(theme) => ({
          alignItems: 'flex-start',
          borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          p: 3,
        })}
      >
        <Box
          sx={(theme) => ({
            alignItems: 'center',
            color: 'icon.action',
            display: 'flex',
            height: 24,
            justifyContent: 'center',
            width: 24,
          })}
        >
          <Group width="24px" height="24px" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={getTitleStyles}>{translate(config.title)}</Box>
          <Box sx={(theme) => ({ ...getSubtitleStyles(theme), mt: 0.5 })}>
            {translate(config.description)}
          </Box>
        </Box>
      </Box>

      <Stack gap={2} sx={{ flex: 1, p: 3 }}>
        {isBuilderOpen && (
          <GroupBuilder
            roles={eligibleRoles}
            selectedRoles={selectedRoles}
            title={config.createTitle}
            onToggleRole={(roleName) => onToggleRole(type, roleName)}
            onCreate={() => onCreateGroup(type)}
            onCancel={() => onCancelBuilder(type)}
          />
        )}

        <AffinityGroup
          groupType={type}
          groups={groups}
          emptyText={config.emptyText}
          emptyTitle={config.emptyTitle}
          useCases={config.useCases}
          onDeleteGroup={onDeleteGroup}
          onDeleteRole={onDeleteRole}
        />

        {!isBuilderOpen && (
          <Button
            isDisabled={!canOpenBuilder}
            onClick={() => onOpenBuilder(type)}
            startIcon={<Plus />}
            type="transparent"
          >
            {config.addLabel}
          </Button>
        )}
      </Stack>
    </Box>
  )
}

AffinityCard.propTypes = {
  type: PropTypes.oneOf(['AFFINED', 'ANTI_AFFINED']).isRequired,
  roles: PropTypes.array,
  groups: PropTypes.array,
  isBuilderOpen: PropTypes.bool,
  selectedRoles: PropTypes.array,
  onOpenBuilder: PropTypes.func,
  onCancelBuilder: PropTypes.func,
  onToggleRole: PropTypes.func,
  onCreateGroup: PropTypes.func,
  onDeleteGroup: PropTypes.func,
  onDeleteRole: PropTypes.func,
}

/**
 * Role Affinity Panel component for managing roles.
 *
 * @param {object} props - The props object
 * @param {Array} props.roles - The list of roles
 * @param {Array} props.affinedGroups - Shared list of affined groups
 * @param {Array} props.antiAffinedGroups - Shared list of anti-affined groups
 * @param {Function} props.onGroupsChange - Callback handler for setting form group values
 * @returns {Component} The rendered component.
 */
const RoleAffinityPanel = ({
  roles = [],
  affinedGroups = [],
  antiAffinedGroups = [],
  onGroupsChange,
}) => {
  const [builderType, setBuilderType] = useState(null)
  const [selectedRolesByType, setSelectedRolesByType] = useState({
    AFFINED: [],
    ANTI_AFFINED: [],
  })

  const validRoles = useMemo(
    () =>
      (Array.isArray(roles) ? roles : []).filter((role) =>
        String(role?.NAME ?? '').trim()
      ),
    [roles]
  )

  const sanitizedAffinedGroups = useMemo(
    () => sanitizeGroups(affinedGroups, validRoles, 'AFFINED'),
    [affinedGroups, validRoles]
  )
  const sanitizedAntiAffinedGroups = useMemo(
    () => sanitizeGroups(antiAffinedGroups, validRoles, 'ANTI_AFFINED'),
    [antiAffinedGroups, validRoles]
  )

  useEffect(() => {
    if (
      areGroupsEqual(affinedGroups, sanitizedAffinedGroups) &&
      areGroupsEqual(antiAffinedGroups, sanitizedAntiAffinedGroups)
    ) {
      return
    }

    onGroupsChange(sanitizedAffinedGroups, sanitizedAntiAffinedGroups)
  }, [
    affinedGroups,
    antiAffinedGroups,
    onGroupsChange,
    sanitizedAffinedGroups,
    sanitizedAntiAffinedGroups,
  ])

  const resetSelection = useCallback((type) => {
    setSelectedRolesByType((current) => ({ ...current, [type]: [] }))
  }, [])

  const handleOpenBuilder = useCallback(
    (type) => {
      setBuilderType(type)
      resetSelection(type)
    },
    [resetSelection]
  )

  const handleCancelBuilder = useCallback(
    (type) => {
      resetSelection(type)
      setBuilderType(null)
    },
    [resetSelection]
  )

  const handleToggleRole = useCallback((type, roleName) => {
    setSelectedRolesByType((current) => {
      const currentRoles = current[type] ?? []
      const nextRoles = currentRoles.includes(roleName)
        ? currentRoles.filter((role) => role !== roleName)
        : currentRoles.concat(roleName)

      return { ...current, [type]: nextRoles }
    })
  }, [])

  const handleAddGroup = useCallback(
    (type) => {
      const selectedRoles = selectedRolesByType[type] ?? []
      if (selectedRoles.length < 2) return

      if (type === 'AFFINED') {
        onGroupsChange(
          sanitizedAffinedGroups.concat([selectedRoles]),
          sanitizedAntiAffinedGroups
        )
      } else {
        onGroupsChange(
          sanitizedAffinedGroups,
          sanitizedAntiAffinedGroups.concat([selectedRoles])
        )
      }

      resetSelection(type)
      setBuilderType(null)
    },
    [
      onGroupsChange,
      resetSelection,
      sanitizedAffinedGroups,
      sanitizedAntiAffinedGroups,
      selectedRolesByType,
    ]
  )

  const handleDeleteGroup = useCallback(
    (groupIndex, type) => {
      if (type === 'AFFINED') {
        onGroupsChange(
          sanitizedAffinedGroups.filter((_, index) => index !== groupIndex),
          sanitizedAntiAffinedGroups
        )
      } else {
        onGroupsChange(
          sanitizedAffinedGroups,
          sanitizedAntiAffinedGroups.filter((_, index) => index !== groupIndex)
        )
      }
    },
    [onGroupsChange, sanitizedAffinedGroups, sanitizedAntiAffinedGroups]
  )

  const handleDeleteRoleFromGroup = useCallback(
    (roleIndex, groupIndex, type) => {
      const updateGroups = (groups) =>
        groups
          .map((group, index) =>
            index === groupIndex
              ? group.filter((_, idx) => idx !== roleIndex)
              : group
          )
          .filter((group) => group.length >= 2)

      if (type === 'AFFINED') {
        onGroupsChange(
          updateGroups(sanitizedAffinedGroups),
          sanitizedAntiAffinedGroups
        )
      } else {
        onGroupsChange(
          sanitizedAffinedGroups,
          updateGroups(sanitizedAntiAffinedGroups)
        )
      }
    },
    [onGroupsChange, sanitizedAffinedGroups, sanitizedAntiAffinedGroups]
  )

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          lg: 'minmax(0, 1fr) minmax(0, 1fr)',
        },
        mt: 2,
      }}
    >
      <AffinityCard
        type="AFFINED"
        roles={validRoles}
        groups={sanitizedAffinedGroups}
        isBuilderOpen={builderType === 'AFFINED'}
        selectedRoles={selectedRolesByType.AFFINED}
        onOpenBuilder={handleOpenBuilder}
        onCancelBuilder={handleCancelBuilder}
        onToggleRole={handleToggleRole}
        onCreateGroup={handleAddGroup}
        onDeleteGroup={handleDeleteGroup}
        onDeleteRole={handleDeleteRoleFromGroup}
      />
      <AffinityCard
        type="ANTI_AFFINED"
        roles={validRoles}
        groups={sanitizedAntiAffinedGroups}
        isBuilderOpen={builderType === 'ANTI_AFFINED'}
        selectedRoles={selectedRolesByType.ANTI_AFFINED}
        onOpenBuilder={handleOpenBuilder}
        onCancelBuilder={handleCancelBuilder}
        onToggleRole={handleToggleRole}
        onCreateGroup={handleAddGroup}
        onDeleteGroup={handleDeleteGroup}
        onDeleteRole={handleDeleteRoleFromGroup}
      />
    </Box>
  )
}

RoleAffinityPanel.propTypes = {
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      NAME: PropTypes.string.isRequired,
      POLICY: PropTypes.string.isRequired,
    })
  ),
  affinedGroups: PropTypes.array,
  antiAffinedGroups: PropTypes.array,
  onGroupsChange: PropTypes.func.isRequired,
}

export default RoleAffinityPanel
