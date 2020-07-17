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

import React, { useState } from 'react';
import {
  Grid,
  List,
  ListItem,
  ListItemText,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Divider
} from '@material-ui/core';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import endpoints from '../../router/endpoints';

const PrincipalMenu = () => {
  const [expanded, setExpanded] = useState('');

  const handleChange = panel => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const routeElement = (title = '', { path = '/', menu = true }) =>
    menu && (
      <ListItem key={`menu-key-${title}`}>
        <ListItemText
          primary={
            <Link
              to={path}
              className={classnames(
                'link',
                'MuiTypography-root',
                'MuiLink-root',
                'MuiLink-underlineHover',
                'MuiTypography-colorPrimary'
              )}
            >
              {title.replace('_', ' ')}
            </Link>
          }
        />
      </ListItem>
    );

  const routeElements = (title = '', routes = {}) => {
    const internal = Object.entries(routes)?.map(
      ([internalTitle, internalRoutes]) =>
        internalRoutes.component && routeElement(internalTitle, internalRoutes)
    );

    return (
      internal.some(components => components !== undefined) && (
        <ExpansionPanel
          square
          expanded={expanded === title}
          onChange={handleChange(title)}
          key={`menu-key-${title}`}
        >
          <ExpansionPanelSummary
            aria-controls="panel1d-content"
            id="panel1d-header"
            expandIcon={<ExpandMoreIcon />}
            className={classnames('link')}
          >
            {title.replace('_', ' ')}
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className={classnames('internalNav')}>
            <List disablePadding style={{ width: '100%' }}>
              {internal}
            </List>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      )
    );
  };

  return (
    <div className={classnames('menu')}>
      <Grid container>
        <Grid item className={classnames('logo-wrapper')}>
          <img
            className={classnames('logo')}
            src="/static/logo.png"
            alt="Opennebula"
          />
        </Grid>
      </Grid>
      <Divider />
      <List>
        {Object.entries(endpoints)?.map(([title, routes]) =>
          routes.component
            ? routeElement(title, routes)
            : routeElements(title, routes)
        )}
      </List>
    </div>
  );
};

export default PrincipalMenu;
