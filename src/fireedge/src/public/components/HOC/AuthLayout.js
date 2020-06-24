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

import React, { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { requestData, removeStoreData, findStorageData } from '../../utils';
import constants from '../../constants';
import components from '../router/endpoints';
import { setUser } from '../../actions';

const AuthLayout = ({ children, history, changeName }) => {
  const [show, setShow] = useState(false);

  const redirectToLogin = () => {
    const { jwtName } = constants;
    removeStoreData(jwtName);
    const { login } = components;
    history.push(login.path);
  };

  useEffect(() => {
    const { jwtName, endpointsRoutes } = constants;
    if (findStorageData && findStorageData(jwtName)) {
      requestData(endpointsRoutes.userInfo).then(response => {
        if (response && response.data && response.data.USER) {
          const { USER: userInfo } = response.data;
          setShow(true);
          changeName(userInfo.NAME);
        } else {
          redirectToLogin();
        }
      });
    } else {
      redirectToLogin();
    }
  }, []);

  return show ? <Fragment>{children}</Fragment> : <Fragment />;
};
AuthLayout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ]),
  history: PropTypes.shape({
    push: PropTypes.func
  }),
  changeName: PropTypes.func
};

AuthLayout.defaultProps = {
  children: '',
  history: {
    push: () => undefined
  },
  changeName: () => undefined
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  changeName: name => dispatch(setUser(name))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthLayout);
