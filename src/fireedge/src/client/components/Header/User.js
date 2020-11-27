import React from 'react'

import { MenuItem, MenuList, Divider, Link } from '@material-ui/core'
import AccountCircleIcon from '@material-ui/icons/AccountCircle'

import useAuth from 'client/hooks/useAuth'
import { Tr, SelectTranslate } from 'client/components/HOC'

import { SignOut } from 'client/constants/translates'
import HeaderPopover from 'client/components/Header/Popover'
import { DevTypography } from 'client/components/Typography'
import { defaultApps, defaultAppName } from 'server/utils/constants/defaults'

const app = defaultAppName ? `/${defaultAppName}` : ''

const User = React.memo(() => {
  const { logout, authUser } = useAuth()

  const handleLogout = () => logout()

  return (
    <HeaderPopover
      id="user-menu"
      buttonLabel={authUser?.NAME}
      icon={<AccountCircleIcon />}
      IconProps={{ 'data-cy': 'header-user-button' }}
      disablePadding
    >
      {() => (
        <MenuList>
          <MenuItem>
            <SelectTranslate />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} data-cy="header-logout-button">
            {Tr(SignOut)}
          </MenuItem>
          {process?.env?.NODE_ENV === 'development' &&
            Object.keys(defaultApps)?.map(appName => (
              <MenuItem key={appName}>
                <Link href={`${app}/${appName}`} style={{ width: '100%' }}>
                  <DevTypography label={appName} />
                </Link>
              </MenuItem>
            ))
          }
        </MenuList>
      )}
    </HeaderPopover>
  )
})

User.displayName = 'UserHeaderComponent'

export default User
