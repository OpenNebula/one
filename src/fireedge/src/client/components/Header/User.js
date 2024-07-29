/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

import { MenuItem, MenuList, Link } from '@mui/material'
import { ProfileCircled as UserIcon } from 'iconoir-react'

import { useAuth, useAuthApi } from 'client/features/Auth'
import HeaderPopover from 'client/components/Header/Popover'
import { DevTypography } from 'client/components/Typography'
import { Translate } from 'client/components/HOC'
import { isDevelopment } from 'client/utils'
import { T, APPS, APP_URL } from 'client/constants'

/**
 * Menu with actions about App: signOut, etc.
 *
 * @returns {ReactElement} Returns user actions list
 */
const User = () => {
  const { user } = useAuth()
  const { logout } = useAuthApi()

  return (
    <HeaderPopover
      id="user-menu"
      buttonLabel={user?.NAME}
      icon={<UserIcon />}
      buttonProps={{ 'data-cy': 'header-user-button' }}
      disablePadding
    >
      {() => (
        <MenuList disablePadding>
          <MenuItem onClick={logout} data-cy="header-logout-button">
            <Translate word={T.SignOut} />
          </MenuItem>
          {isDevelopment() &&
            APPS?.map((appName) => (
              <MenuItem key={appName}>
                <Link
                  width="100%"
                  color="secondary"
                  href={`${APP_URL}/${appName}`}
                >
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
