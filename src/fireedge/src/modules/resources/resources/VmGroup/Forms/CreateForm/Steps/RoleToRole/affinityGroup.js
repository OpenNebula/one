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
import { Box, Stack } from '@mui/material'
import { Cancel, Group, Trash } from 'iconoir-react'
import { Component } from 'react'
import { useTranslation } from '@ProvidersModule'
import { T } from '@ConstantsModule'
import { Button, CollapsiblePanel, Tag, Tooltip } from '@ComponentsV2Module'

const EMPTY_ICON_SIZE = '24px'

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

const getDropdownTextStyles = (theme) => ({
  color: 'text.disabled',
  fontSize: {
    xs: theme.fontSize.body.caption.mobile,
    sm: theme.fontSize.body.caption.tablet,
    md: theme.fontSize.body.caption.desktop,
  },
  fontWeight: {
    xs: 500,
    sm: 500,
    md: 500,
  },
  lineHeight: {
    xs: theme.lineHeight.body.caption.mobile,
    sm: theme.lineHeight.body.caption.tablet,
    md: theme.lineHeight.body.caption.desktop,
  },
})

/**
 * Role chip used inside a role affinity group.
 *
 * @param {object} props - Component props
 * @param {string} props.role - Role name
 * @param {Function} props.onDelete - Delete handler
 * @returns {Component} Role chip
 */
const RoleChip = ({ role, onDelete }) => (
  <Box
    sx={(theme) => ({
      alignItems: 'center',
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderRadius: `${theme.borderRadius.xlg}px`,
      display: 'inline-flex',
      gap: 0.5,
      maxWidth: '100%',
      minWidth: 0,
      px: 1,
      py: 0.5,
    })}
  >
    <Tag title={role} />
    <Button
      aria-label="remove"
      iconOnly={<Cancel />}
      isDestructive
      onClick={onDelete}
      size="small"
      type="transparent"
    />
  </Box>
)

RoleChip.propTypes = {
  role: PropTypes.string,
  onDelete: PropTypes.func,
}

/**
 * Affinity group component displays the affinity groups and their descriptions.
 *
 * @param {object} props - The props that are passed to this component.
 * @param {string} props.groupType - The type of group, either 'AFFINED' or 'ANTI_AFFINED'.
 * @param {Array} props.groups - The list of groups, each an array of roles.
 * @param {string} props.emptyTitle - Empty state title
 * @param {string} props.emptyText - Empty state text
 * @param {Array} props.useCases - Use case translation keys
 * @param {Function} props.onDeleteGroup - Callback function for deleting an entire group.
 * @param {Function} props.onDeleteRole - Callback function for deleting a single role from a group.
 * @returns {Component} A component displaying affinity groups.
 */
export const AffinityGroup = ({
  groupType,
  groups = [],
  emptyTitle,
  emptyText,
  useCases = [],
  onDeleteGroup,
  onDeleteRole,
}) => {
  const { translate } = useTranslation()

  return (
    <Stack gap={2}>
      {groups.length === 0 ? (
        <Box
          sx={(theme) => ({
            alignItems: 'center',
            border: `${theme.borderWidth.sm}px dashed ${theme.palette.border.primary}`,
            borderRadius: `${theme.borderRadius.xlg}px`,
            color: 'text.disabled',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            justifyContent: 'center',
            minHeight: 180,
            p: 3,
            textAlign: 'center',
          })}
        >
          <Group width={EMPTY_ICON_SIZE} height={EMPTY_ICON_SIZE} />
          <Box sx={getTitleStyles}>{emptyTitle}</Box>
          <Box sx={getSubtitleStyles}>{emptyText}</Box>
        </Box>
      ) : (
        <Stack gap={1.5}>
          {groups.map((group, groupIndex) => (
            <Box
              key={`${groupType}-${groupIndex}-${group.join('-')}`}
              sx={(theme) => ({
                alignItems: 'center',
                border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
                borderRadius: `${theme.borderRadius.xlg}px`,
                display: 'flex',
                gap: 1,
                justifyContent: 'space-between',
                p: 1,
              })}
            >
              <Stack direction="row" flexWrap="wrap" gap={1} minWidth={0}>
                {group.map((role, roleIndex) => (
                  <RoleChip
                    key={`${groupType}-${groupIndex}-${role}`}
                    role={role}
                    onDelete={() =>
                      onDeleteRole(roleIndex, groupIndex, groupType)
                    }
                  />
                ))}
              </Stack>
              <Tooltip title="Remove group">
                <Box component="span" sx={{ flex: '0 0 auto' }}>
                  <Button
                    aria-label="remove group"
                    iconOnly={<Trash />}
                    isDestructive
                    onClick={() => onDeleteGroup(groupIndex, groupType)}
                    size="small"
                    type="transparent"
                  />
                </Box>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      )}

      <Box>
        <CollapsiblePanel
          title={translate(T.PotentialUseCases)}
          isDefaultCollapsed
          contentProps={{ sx: { py: 2 } }}
        >
          <Box
            component="ul"
            sx={(theme) => ({
              ...getDropdownTextStyles(theme),
              m: 0,
              pl: 3,
            })}
          >
            {useCases.map((useCase) => (
              <li key={useCase}>{translate(useCase)}</li>
            ))}
          </Box>
        </CollapsiblePanel>
      </Box>
    </Stack>
  )
}

AffinityGroup.propTypes = {
  groupType: PropTypes.oneOf(['AFFINED', 'ANTI_AFFINED']).isRequired,
  groups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  emptyTitle: PropTypes.string,
  emptyText: PropTypes.string,
  useCases: PropTypes.arrayOf(PropTypes.string),
  onDeleteGroup: PropTypes.func.isRequired,
  onDeleteRole: PropTypes.func.isRequired,
}
