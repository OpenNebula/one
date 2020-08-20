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
import { useHistory } from 'react-router-dom';

import {
  Grid,
  List,
  Drawer,
  Divider,
  Collapse,
  ListItem,
  ListItemText
} from '@material-ui/core';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import sidebarStyles from 'client/components/Sidebar/styles';
import useGeneral from 'client/hooks/useGeneral';
import endpoints from 'client/router/endpoints';

const LinkItem = React.memo(({ label, path }) => {
  const history = useHistory();

  return (
    <ListItem button onClick={() => history.push(path)}>
      <ListItemText primary={label} />
    </ListItem>
  );
});

const CollapseItem = React.memo(({ label, routes }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => setExpanded(!expanded);

  return (
    <>
      <ListItem button onClick={handleExpand}>
        <ListItemText primary={label} />
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItem>
      {routes?.map((subItem, index) => (
        <Collapse
          key={`subitem-${index}`}
          in={expanded}
          timeout="auto"
          unmountOnExit
        >
          <List component="div" disablePadding>
            <LinkItem {...subItem} />
          </List>
        </Collapse>
      ))}
    </>
  );
});

const Sidebar = () => {
  const classes = sidebarStyles();
  const { isOpenMenu, openMenu } = useGeneral();

  return React.useMemo(
    () => (
      <Drawer anchor="left" open={isOpenMenu} onClose={() => openMenu(false)}>
        <div className={classes.menu}>
          <Grid container>
            <Grid item className={classes.logoWrapper}>
              <img
                className={classes.logo}
                src="/static/logo.png"
                alt="Opennebula"
              />
            </Grid>
          </Grid>
          <Divider />
          <List>
            {endpoints
              ?.filter(({ authenticated = true }) => authenticated)
              ?.map((endpoint, index) =>
                endpoint.routes ? (
                  <CollapseItem key={`item-${index}`} {...endpoint} />
                ) : (
                  <LinkItem key={`item-${index}`} {...endpoint} />
                )
              )}
          </List>
        </div>
      </Drawer>
    ),
    [isOpenMenu, openMenu]
  );
};

export default Sidebar;
