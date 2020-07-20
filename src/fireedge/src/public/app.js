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

import React, { Suspense } from 'react';
import { StaticRouter, BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';

import {
  CssBaseline,
  ThemeProvider,
  createMuiTheme,
  responsiveFontSizes
} from '@material-ui/core';

import themeOne from 'client/assets/theme';
import { TranslateProvider } from 'client/components/HOC';
import Router from 'client/router';

const theme = createMuiTheme(themeOne);

const App = ({ location, context, store }) => (
  <ThemeProvider theme={responsiveFontSizes(theme)}>
    <CssBaseline />
    <Provider store={store}>
      {location && context ? (
        // server build
        <StaticRouter location={location} context={context}>
          <TranslateProvider>
            <Router />
          </TranslateProvider>
        </StaticRouter>
      ) : (
        // browser build
        <BrowserRouter>
          <TranslateProvider>
            <Router />
          </TranslateProvider>
        </BrowserRouter>
      )}
    </Provider>
  </ThemeProvider>
);

App.propTypes = {
  location: PropTypes.string,
  context: PropTypes.shape({}),
  store: PropTypes.shape({})
};

App.defaultProps = {
  location: '',
  context: {},
  store: {}
};

export default App;
