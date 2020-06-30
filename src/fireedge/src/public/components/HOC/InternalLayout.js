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
import { Drawer, Box, Container } from '@material-ui/core';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Header from '../containers/Header';
import Footer from '../containers/Footer';
import PrincipalMenu from '../containers/PrincipalMenu';
import { showMenu } from '../../actions';

const InternalLayout = ({ children, display, displayMenu, title }) => (
  <Box display="flex" width="100%">
    <Header title={title} />
    <Drawer anchor="left" open={display} onClose={() => displayMenu(false)}>
      <PrincipalMenu />
    </Drawer>
    <Container component="main" style={{ paddingTop: 96, paddingBottom: 96, height: '100vh' }}>
      {children}
    </Container>
    <Footer />
  </Box>
);

InternalLayout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ]),
  display: PropTypes.bool,
  displayMenu: PropTypes.func,
  title: PropTypes.string
};

InternalLayout.defaultProps = {
  children: [],
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
)(InternalLayout);
