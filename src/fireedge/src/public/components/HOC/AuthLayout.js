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

import React, { useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';

import useAuth from 'client/hooks/auth/useAuth';
import routes from 'client/router/endpoints';

const AuthLayout = ({ children }) => {
  const history = useHistory();
  const { getAuthUser, jwt, isLogged } = useAuth();

  useEffect(() => {
    if (jwt) {
      getAuthUser();
    } else if (!isLogged) {
      history.push(routes.login.path);
    }
  }, [jwt, isLogged]);

  return isLogged ? <Fragment>{children}</Fragment> : <Fragment />;
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
