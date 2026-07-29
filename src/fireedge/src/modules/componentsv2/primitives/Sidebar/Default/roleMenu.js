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

import { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Divider, MenuItem, MenuList, Typography } from '@mui/material'
import {
  CheckCircle,
  Cloud,
  Group,
  NavArrowDown,
  NavArrowUp,
  User,
  UserCrown,
} from 'iconoir-react'

import { SystemAPI, useAuthApi, useViews } from '@FeaturesModule'
import { MenuDropdown } from '@modules/componentsv2/primitives/Dropdown'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

const VIEW_ICONS = {
  admin: UserCrown,
  cloud: Cloud,
  groupadmin: Group,
  user: User,
}

const getSourceText = (text, fallback = '') =>
  text ? T[text] ?? text : fallback

/**
 * Sidebar role option.
 *
 * @param {object} root0 - Props
 * @param {object} root0.role - Role option
 * @param {boolean} root0.isSelected - Whether the role is selected
 * @param {Function} root0.onSelect - Role select callback
 * @returns {object} Sidebar role option component
 */
const RoleOption = ({ role, isSelected = false, onSelect }) => {
  const { view, label, description, icon: Icon } = role

  return (
    <MenuItem
      className={['option', isSelected && 'selected'].filter(Boolean).join(' ')}
      data-cy={`view-${view}`}
      disableGutters
      aria-selected={isSelected}
      onClick={() => onSelect(view)}
    >
      <Icon className="icon" />
      <Box className="copy">
        <Typography className="title">{label}</Typography>
        {description && (
          <Typography className="description">{description}</Typography>
        )}
      </Box>
      {isSelected && <CheckCircle className="check" />}
    </MenuItem>
  )
}

RoleOption.propTypes = {
  role: PropTypes.shape({
    view: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
}

/**
 * Sidebar role trigger and menu shell for the v2 sidebar.
 *
 * @param {object} root0 - Props
 * @param {boolean} root0.isExpanded - Sidebar expanded state
 * @returns {object} Sidebar role menu component
 */
export const SidebarRoleMenu = ({ isExpanded = false }) => {
  const { translate } = useTranslation()
  const { view: currentView, views = {} } = useViews()
  const { data: viewDefinitions = [] } =
    SystemAPI.useGetSunstoneAvailableViewsQuery()
  const { changeView } = useAuthApi()

  const availableRoles = useMemo(() => {
    const availableViewNames = Object.keys(views)
    const viewDefinitionByType = viewDefinitions.reduce((acc, view) => {
      const type = view.type ?? view.name

      return type ? { ...acc, [type]: view } : acc
    }, {})

    return availableViewNames.map((view) => {
      const definition = viewDefinitionByType[view]
      const sourceLabel = getSourceText(definition?.name, view)
      const translatedLabel = translate(sourceLabel)

      return {
        view,
        label:
          translatedLabel === sourceLabel
            ? sourceLabel.replace(/\s+view$/i, '')
            : translatedLabel,
        description: translate(getSourceText(definition?.description)),
        icon: VIEW_ICONS[view] ?? User,
      }
    })
  }, [translate, views, viewDefinitions])

  const selectedRole = availableRoles.find(
    ({ view }) => view === currentView
  ) ??
    availableRoles[0] ?? { icon: User, label: currentView, view: currentView }

  const handleRoleSelect = useCallback(
    (view) => {
      view && view !== currentView && changeView(view)
    },
    [changeView, currentView]
  )

  return (
    <Box className="role-menu">
      <MenuDropdown
        className={`dropdown ${selectedRole?.view ?? ''}`}
        dataCy="header-view-button"
        id="sidebar-role-menu"
        expanded={isExpanded}
        title={selectedRole.label}
        icon={NavArrowDown}
        openIcon={NavArrowUp}
        avatarSize="medium"
        initials={selectedRole.label[0]}
        offset={[-2, 4]}
      >
        <Box className="panel">
          <Box className="header">
            <Typography className="title">
              {translate(T.ViewingAs)} {selectedRole.label}
            </Typography>
            <Typography className="subtitle">
              {translate(T.SwitchRole)}
            </Typography>
          </Box>

          <Divider className="divider" />

          <MenuList className="options" disablePadding>
            {availableRoles.map((role) => (
              <RoleOption
                key={role.view}
                role={role}
                isSelected={role.view === selectedRole.view}
                onSelect={handleRoleSelect}
              />
            ))}
          </MenuList>
        </Box>
      </MenuDropdown>
    </Box>
  )
}

SidebarRoleMenu.propTypes = {
  isExpanded: PropTypes.bool,
}

SidebarRoleMenu.displayName = 'SidebarRoleMenu'
