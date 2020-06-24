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

import React, { Fragment, useState } from 'react';

import {
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  Grid
} from '@material-ui/core';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import constants from '../../../constants';
import { endpoints as routerEndpoints } from '../../../components/router';
import { requestData, removeStoreData, storage } from '../../../utils';
import { Translate, Tr } from '../../HOC';

const { SignIn, Username, Password, keepLoggedIn, Token2FA } = constants;

const Login = ({ history, baseURL }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [token, setToken] = useState('');
  const [writeToken, setWriteToken] = useState(false);
  const [showError, setShowError] = useState(false);
  const [keepLogged, setKeepLogged] = useState(false);

  const handleChange = (type = '', element) => {
    if (
      element &&
      element.preventDefault &&
      element.target &&
      element.target.type &&
      type
    ) {
      if (showError) {
        setShowError(!showError);
      }
      const { target } = element;
      switch (type) {
        case 'user':
          setUser(target.value);
          break;
        case 'pass':
          setPass(target.value);
          break;
        case 'token':
          setToken(target.value);
          break;
        case 'keepLogged':
          setKeepLogged(!keepLogged);
          break;
        default:
          break;
      }
    }
  };

  const handleSubmit = element => {
    const { jwtName, endpointsRoutes } = constants;
    const loginParams = {
      data: { user, pass },
      method: 'POST',
      authenticate: false,
      baseURL
    };
    if (writeToken && token) {
      loginParams.data.token = token;
    }
    if (element && element.preventDefault) {
      element.preventDefault();
      if (user && pass) {
        removeStoreData(jwtName);
        requestData(endpointsRoutes.login, loginParams).then(response => {
          if (response && response.data) {
            const { id, data } = response;
            const { token: opennebulaToken, message } = data;
            setShowError(false);
            if (id === 401 && message) {
              setWriteToken(true);
            } else if (id === 200 && opennebulaToken) {
              setWriteToken(false);
              storage(jwtName, opennebulaToken, keepLogged);
              history.push(routerEndpoints.dashboard.path);
            }
          }
        });
      } else {
        setShowError(true);
      }
    }
  };

  const inputs = writeToken ? (
    <Grid item xs style={{ marginBottom: '1rem' }}>
      <TextField
        fullWidth
        required
        label={Tr(Token2FA)}
        defaultValue={token}
        autoComplete="off"
        placeholder={Tr(Token2FA)}
        onChange={e => {
          handleChange('token', e);
        }}
      />
    </Grid>
  ) : (
    <Fragment>
      <Grid item xs={12} style={{ marginBottom: '1rem' }}>
        <TextField
          fullWidth
          required
          label={Tr(Username)}
          defaultValue={user}
          autoComplete="off"
          onChange={e => {
            handleChange('user', e);
          }}
        />
      </Grid>
      <Grid item xs={12} style={{ marginBottom: '1rem' }}>
        <TextField
          fullWidth
          required
          label={Tr(Password)}
          defaultValue={pass}
          type="password"
          autoComplete="off"
          onChange={e => {
            handleChange('pass', e);
          }}
        />
      </Grid>
    </Fragment>
  );

  return (
    <Box
      style={{
        width: '100%',
        height: '100vh',
        justifyContent: 'center',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <form onSubmit={handleSubmit}>
        <Grid container>
          {inputs}
          <Grid item xs={12}>
            <Grid
              container
              direction="row"
              justify="center"
              alignItems="center"
            >
              <Grid item md={6} style={{ textAlign: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={keepLogged}
                      onChange={e => {
                        handleChange('keepLogged', e);
                      }}
                      color="primary"
                    />
                  }
                  label={Tr(keepLoggedIn)}
                />
              </Grid>
              <Grid item md={6} style={{ textAlign: 'center' }}>
                <Button variant="contained" color="primary" type="submit">
                  <Translate word={SignIn} />
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

Login.propTypes = {
  baseURL: PropTypes.string,
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
  baseURL: '',
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

const mapStateToProps = state => {
  const { System } = state;
  return {
    baseURL: System.baseURL
  };
};

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);
