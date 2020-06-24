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
import LoginComponent from '../containers/Login';

const Login = ({ history, match }) => (
  <LoginComponent history={history} match={match} />
);

Login.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func
  }),
  match: PropTypes.shape({
    params: PropTypes.shape({}),
    path: PropTypes.string,
    isExact: PropTypes.bool,
    url: PropTypes.string
  })
};

Login.defaultProps = {
  history: {
    push: () => undefined
  },
  match: {
    params: {},
    path: '',
    isExact: false,
    url: ''
  }
};
export default Login;
