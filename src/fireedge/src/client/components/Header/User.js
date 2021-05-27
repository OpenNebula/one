import * as React from 'react'

import { MenuItem, MenuList, Link } from '@material-ui/core'
import AccountCircleIcon from '@material-ui/icons/AccountCircle'

import { useAuth, useAuthApi } from 'client/features/Auth'
import HeaderPopover from 'client/components/Header/Popover'
import { DevTypography } from 'client/components/Typography'
import { Tr } from 'client/components/HOC'
import { isDevelopment } from 'client/utils'
import { T, APPS, APP_URL } from 'client/constants'

const User = React.memo(() => {
  const { user } = useAuth()
  const { logout } = useAuthApi()

  const handleLogout = () => logout()

  return (
    <HeaderPopover
      id='user-menu'
      buttonLabel={user?.NAME}
      icon={<AccountCircleIcon />}
      buttonProps={{ 'data-cy': 'header-user-button', variant: 'outlined' }}
      disablePadding
    >
      {() => (
        <MenuList>
          <MenuItem onClick={handleLogout} data-cy='header-logout-button'>
            {Tr(T.SignOut)}
          </MenuItem>
          {isDevelopment() &&
            APPS?.map(appName => (
              <MenuItem key={appName}>
                <Link color='secondary' href={`${APP_URL}/${appName}`} style={{ width: '100%' }}>
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
