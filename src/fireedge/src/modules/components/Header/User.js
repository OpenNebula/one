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
import { ReactElement } from 'react'

import { Avatar, Link, MenuItem, MenuList } from '@mui/material'

import { APPS, APP_URL, T } from '@ConstantsModule'
import { useAuth, useAuthApi } from '@FeaturesModule'
import HeaderPopover from '@modules/components/Header/Popover'
import { Translate } from '@modules/components/HOC'
import { DevTypography } from '@modules/components/Typography'
import { isDevelopment } from '@UtilsModule'
import { useHistory } from 'react-router-dom'

/**
 * Menu with actions about App: signOut, etc.
 *
 * @returns {ReactElement} Returns user actions list
 */
const User = () => {
  const { user } = useAuth()
  const { logout } = useAuthApi()
  const history = useHistory()

  return (
    <HeaderPopover
      id="user-menu"
      buttonLabel={user?.NAME}
      icon={
        <Avatar
          src={user?.TEMPLATE?.FIREEDGE?.IMAGE_PROFILE}
          alt="User"
          sx={{ width: 24, height: 24 }}
        />
      }
      buttonProps={{ 'data-cy': 'header-user-button', noborder: true }}
      disablePadding
    >
      {() => (
        <MenuList disablePadding>
          <MenuItem onClick={logout} data-cy="header-logout-button">
            <Translate word={T.SignOut} />
          </MenuItem>
          <MenuItem
            onClick={() => history.push('/settings')}
            data-cy="header-settings-button"
          >
            <Translate word={T.Settings} />
          </MenuItem>
          {isDevelopment() &&
            APPS?.map((appName) => (
              <MenuItem key={appName}>
                <Link width="100%" href={`${APP_URL}/${appName}`}>
                  <DevTypography>{appName}</DevTypography>
                </Link>
              </MenuItem>
            ))}
        </MenuList>
      )}
    </HeaderPopover>
  )
}

User.displayName = 'UserHeaderComponent'

export default User
