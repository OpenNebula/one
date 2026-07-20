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
import {
  Avatar,
  Box,
  Divider,
  MenuList,
  Typography,
  useTheme,
} from '@mui/material'
import {
  LogOut,
  Settings,
  SunLight,
  FolderSettings,
  ArrowSeparateVertical,
} from 'iconoir-react'
import { useHistory } from 'react-router-dom'
import {
  MenuDropdown,
  DropdownItem,
} from '@modules/componentsv2/primitives/Dropdown'
import { Switch } from '@modules/componentsv2/primitives/Buttons/Switch/Default'

import {
  AuthAPI,
  SupportAPI,
  SystemAPI,
  UserAPI,
  useAuth,
  useAuthApi,
  useGeneralApi,
} from '@FeaturesModule'
import { SCHEMES, SERVER_CONFIG, T } from '@ConstantsModule'
import { jsonToXml, generateDocLink } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

const SETTINGS_PATH = '/settings'

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(([letter]) => letter)
    .join('')
    .toUpperCase() || 'U'

/**
 * Footer user trigger and menu shell for the v2 sidebar.
 *
 * @param {object} root0 - Props
 * @param {boolean} root0.isExpanded - Sidebar expanded state
 * @returns {object} Sidebar user menu component
 */
export const SidebarUserMenu = ({ isExpanded = false }) => {
  const { translate } = useTranslation()
  const { user, groups, settings: { SCHEME = SCHEMES.LIGHT } = {} } = useAuth()
  const { changeAuthUser } = useAuthApi()
  const { enqueueError } = useGeneralApi()
  const [logout] = AuthAPI.useLogoutMutation()
  const [updateUser] = UserAPI.useUpdateUserMutation()
  const theme = useTheme()
  const isLightMode =
    SCHEME === SCHEMES.SYSTEM
      ? theme.palette.mode === SCHEMES.LIGHT
      : SCHEME === SCHEMES.LIGHT
  const { isSuccess: isSupported } = SupportAPI.useCheckOfficialSupportQuery(
    undefined,
    {
      skip: !SERVER_CONFIG?.token_remote_support,
    }
  )
  const { data: version } = SystemAPI.useGetOneVersionQuery()
  const history = useHistory()

  const userName = user?.NAME ?? ''
  const userImage = user?.TEMPLATE?.FIREEDGE?.IMAGE_PROFILE
  const primaryGroup = useMemo(
    () => groups?.find(({ ID }) => `${ID}` === `${user?.GID}`),
    [groups, user?.GID]
  )
  const primaryGroupName = primaryGroup?.NAME
  const initials = useMemo(() => getInitials(userName), [userName])

  const documentationUrl = useMemo(
    () => generateDocLink(version, ''),
    [version]
  )

  const handleSettings = () => {
    history.push(SETTINGS_PATH)
  }

  const handleDocumentation = () => {
    documentationUrl &&
      window.open(documentationUrl, '_blank', 'noopener,noreferrer')
  }

  const handleThemeChange = useCallback(
    async (nextScheme) => {
      const fireedge = {
        ...(user?.TEMPLATE?.FIREEDGE ?? {}),
        SCHEME: nextScheme,
      }

      changeAuthUser({
        ...user,
        TEMPLATE: {
          ...(user?.TEMPLATE ?? {}),
          FIREEDGE: fireedge,
        },
      })

      try {
        const result = await updateUser({
          id: user.ID,
          template: jsonToXml({ FIREEDGE: fireedge }),
          replace: 1,
        })

        if (result?.error) throw result.error
      } catch {
        enqueueError(T.SomethingWrong)
      }
    },
    [changeAuthUser, enqueueError, updateUser, user]
  )

  const handleThemeToggle = useCallback(() => {
    handleThemeChange(isLightMode ? SCHEMES.DARK : SCHEMES.LIGHT)
  }, [handleThemeChange, isLightMode])

  const handleSwitchThemeChange = useCallback(
    (checked) => {
      handleThemeChange(checked ? SCHEMES.LIGHT : SCHEMES.DARK)
    },
    [handleThemeChange]
  )

  const handleSwitchClick = useCallback((event) => {
    event.stopPropagation()
  }, [])

  const handleLogout = () => {
    logout()
  }

  return (
    <Box className="user-menu">
      <MenuDropdown
        className="user-menu-dropdown"
        id="sidebar-user-menu"
        expanded={isExpanded}
        title={userName}
        subtitle={primaryGroupName}
        icon={ArrowSeparateVertical}
        image={userImage}
        initials={initials}
        offset={[-2, 4]}
        dataCy="sidebar-user-menu"
      >
        <Box className="section">
          <Box className="user-avatar">
            <Avatar src={userImage} className="avatar">
              {initials}
            </Avatar>
            <Box className="user-info">
              <Typography className="name">
                {userName || translate(T.User)}
              </Typography>
              {primaryGroupName && (
                <Typography className="subtitle">{primaryGroupName}</Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Divider />

        <MenuList className="section" disablePadding>
          <DropdownItem
            icon={Settings}
            label={`${translate(T.Profile)} ${translate(T.Settings)}`}
            onClick={handleSettings}
            dataCy="sidebar-settings-button"
          />

          <DropdownItem
            icon={FolderSettings}
            label={translate(T.Resources)}
            onClick={handleDocumentation}
            dataCy="sidebar-resources-button"
          />
        </MenuList>

        <Divider />

        <Box className="section sidebar-user-menu-item sidebar-user-menu-switch-row">
          <DropdownItem
            icon={SunLight}
            label={`${translate(T.Light)} ${translate(T.Mode)}`}
            onClick={handleThemeToggle}
            dataCy="sidebar-theme-button"
            control={
              <Switch
                size="small"
                isChecked={isLightMode}
                onChange={handleSwitchThemeChange}
                switchProps={{
                  inputProps: {
                    'aria-label': `${translate(T.Light)} ${translate(T.Mode)}`,
                    'data-cy': 'theme-switch',
                  },
                  onClick: handleSwitchClick,
                }}
              />
            }
          />
        </Box>

        <Divider />

        <MenuList className="section" disablePadding>
          <DropdownItem
            icon={LogOut}
            label={translate(T.SignOut)}
            onClick={handleLogout}
            dataCy="sidebar-logout-button"
          />
        </MenuList>
      </MenuDropdown>

      {isExpanded && (
        <Box className="meta-info">
          <Typography className="one-version">
            {version && `v${version}`}
          </Typography>
          <Typography
            className={`one-supported ${
              isSupported ? 'supported' : 'unsuported'
            }`}
          >
            {translate(
              isSupported ? T.OfficiallySupport : T.NotOfficiallySupport
            )}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

SidebarUserMenu.propTypes = {
  isExpanded: PropTypes.bool,
}

SidebarUserMenu.displayName = 'SidebarUserMenu'
