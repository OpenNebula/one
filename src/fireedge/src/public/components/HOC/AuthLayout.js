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

import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';

import { LinearProgress } from '@material-ui/core';

import useAuth from 'client/hooks/useAuth';
import { PATH } from 'client/router/endpoints';

const AuthLayout = ({ children }) => {
  const { isLoginInProcess, isLogged, firstRender, getAuthInfo } = useAuth();

  useEffect(() => {
    if (isLogged && !isLoginInProcess) {
      getAuthInfo();
    }
  }, [isLogged, isLoginInProcess]);

  if (firstRender) {
    return <LinearProgress style={{ width: '100%' }} />;
  } else if (!isLogged && !isLoginInProcess) {
    return <Redirect to={PATH.LOGIN} />;
  }

  return <Fragment>{children}</Fragment>;
};

AuthLayout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ])
};

AuthLayout.defaultProps = {
  children: ''
};

export default AuthLayout;
