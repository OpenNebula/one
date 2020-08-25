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

import { makeStyles, Box, Container } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';

import useAuth from 'client/hooks/useAuth';
import useOpenNebula from 'client/hooks/useOpennebula';
import Header from 'client/components/Header';
import Footer from 'client/components/Footer';

const internalStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    width: '100%'
  },
  main: {
    paddingTop: 64,
    paddingBottom: 30,
    height: '100vh',
    width: '100vw'
  },
  scrollable: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    height: '100%',
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: 14
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundClip: 'content-box',
      border: '4px solid transparent',
      borderRadius: 7,
      boxShadow: 'inset 0 0 0 10px',
      color: theme.palette.primary.light
    }
  }
}));

const InternalLayout = ({ children, title }) => {
  const classes = internalStyles();
  const { groups } = useOpenNebula();
  const { authUser } = useAuth();

  const isAuthenticating = Boolean(!authUser && !groups?.length);

  return isAuthenticating ? (
    <Box width="100%" display="flex" flexDirection="column">
      <Skeleton variant="rect" width="100%" height={64} />
      <Box padding={2}>
        <Skeleton variant="rect" width="50%" height={32} />
      </Box>
    </Box>
  ) : (
    <>
      <Header title={title} />
      <Box component="main" className={classes.main}>
        <Container component="div" className={classes.scrollable}>
          {children}
        </Container>
      </Box>
      <Footer />
    </>
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
