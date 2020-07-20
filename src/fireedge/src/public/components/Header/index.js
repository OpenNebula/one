/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  LinearProgress
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

import useGeneral from 'client/hooks/useGeneral';

import User from './User';
import Zone from './Zone';

const Header = ({ title }) => {
  const { isLoading, isOpenMenu, openMenu } = useGeneral();

  return (
    <AppBar position="fixed" className={classnames('header')} data-cy="header">
      <Toolbar>
        <IconButton
          onClick={() => openMenu(!isOpenMenu)}
          edge="start"
          className=""
          color="inherit"
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          style={{ flexGrow: 1 }}
          className={classnames('title')}
          data-cy="header-title"
        >
          {title}
        </Typography>
        <User />
        <Zone />
      </Toolbar>
      {isLoading && <LinearProgress />}
    </AppBar>
  );
};

Header.propTypes = {
  title: PropTypes.string
};

Header.defaultProps = {
  title: ''
};

export default Header;
