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
import clsx from 'clsx';

import { Box, Container } from '@material-ui/core';
import useGeneral from 'client/hooks/useGeneral';

import Footer from 'client/components/Footer';
import Header from 'client/components/Header';

import internalStyles from 'client/components/HOC/InternalLayout/styles';

const InternalLayout = ({ authRoute, label, children }) => {
  const classes = internalStyles();
  const { isFixMenu } = useGeneral();

  return authRoute ? (
    <Box className={clsx(classes.root, { [classes.isDrawerFixed]: isFixMenu })}>
      <Header title={label} />
      <Box component="main" className={classes.main}>
        <Container component="div" className={classes.scrollable}>
          {children}
        </Container>
      </Box>
      <Footer />
    </Box>
  ) : (
    children
  );
};

InternalLayout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ]),
  authRoute: PropTypes.bool.isRequired,
  label: PropTypes.string
};

InternalLayout.defaultProps = {
  children: [],
  authRoute: false,
  label: null
};

export default InternalLayout;
