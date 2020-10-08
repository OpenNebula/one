import React from 'react';
import { useHistory } from 'react-router-dom';
import { MenuItem, MenuList, Divider } from '@material-ui/core';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

import useAuth from 'client/hooks/useAuth';
import { Tr, SelectTranslate } from 'client/components/HOC';

import { SignOut } from 'client/constants/translates';
import { PATH } from 'client/router/endpoints';
import HeaderPopover from 'client/components/Header/Popover';

const User = React.memo(() => {
  const history = useHistory();
  const { logout, authUser } = useAuth();

  const handleLogout = () => logout();
  const handleGoToSettings = () => history.push(PATH.SETTINGS);

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
          <MenuItem onClick={handleGoToSettings}>{Tr('Settings')}</MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} data-cy="header-logout-button">
            {Tr(SignOut)}
          </MenuItem>
        </MenuList>
      )}
    </HeaderPopover>
  );
});

export default User;
