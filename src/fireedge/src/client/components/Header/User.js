import * as React from 'react'

import { MenuItem, MenuList, Divider, Link } from '@material-ui/core'
import AccountCircleIcon from '@material-ui/icons/AccountCircle'

import { useAuth } from 'client/hooks'
import HeaderPopover from 'client/components/Header/Popover'
import { DevTypography } from 'client/components/Typography'
import { Tr, SelectTranslate } from 'client/components/HOC'
import { T, APPS, APP_URL } from 'client/constants'

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
            {Tr(T.SignOut)}
          </MenuItem>
          {process?.env?.NODE_ENV === 'development' &&
            APPS?.map(appName => (
              <MenuItem key={appName}>
                <Link href={`${APP_URL}/${appName}`} style={{ width: '100%' }}>
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
