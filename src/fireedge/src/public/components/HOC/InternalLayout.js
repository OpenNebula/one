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

import { Drawer, Box, Container } from '@material-ui/core';

import Header from 'client/components/Header';
import Footer from 'client/components/Footer';
import Sidebar from 'client/components/Sidebar';
import useGeneral from 'client/hooks/useGeneral';

const InternalLayout = ({ children, title }) => {
  const { isOpenMenu, openMenu } = useGeneral();

  return (
    <Box display="flex" width="100%">
      <Header title={title} />
      <Drawer anchor="left" open={isOpenMenu} onClose={() => openMenu(false)}>
        <Sidebar />
      </Drawer>
      <Container
        component="main"
        style={{ paddingTop: 96, paddingBottom: 96, height: '100vh' }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

InternalLayout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ]),
  title: PropTypes.string
};

InternalLayout.defaultProps = {
  children: [],
  title: ''
};

export default InternalLayout;
