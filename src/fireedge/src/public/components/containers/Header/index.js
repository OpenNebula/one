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
import { AppBar, Toolbar, IconButton, Typography } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import User from './User';
import Zone from './Zone';
import { showMenu } from '../../../actions';

const Header = ({ display, displayMenu: displayMenuFromProps, title }) => {
  const displayMenu = () => {
    displayMenuFromProps(!display);
  };
  return (
    <AppBar position="fixed" className={classnames('header')}>
      <Toolbar>
        <IconButton
          onClick={displayMenu}
          edge="start"
          className=""
          color="inherit"
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          <b className={classnames('title')}>{title}</b>
        </Typography>
        <User />
        <Zone />
      </Toolbar>
    </AppBar>
  );
};

Header.propTypes = {
  display: PropTypes.bool,
  displayMenu: PropTypes.func,
  title: PropTypes.string
};

Header.defaultProps = {
  display: false,
  displayMenu: () => undefined,
  title: ''
};

const mapStateToProps = state => {
  const { General } = state;
  return {
    display: General.displayMenu
  };
};

const mapDispatchToProps = dispatch => ({
  displayMenu: display => dispatch(showMenu(display))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Header);
