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

import { List, Drawer, Divider, Box } from '@material-ui/core';

import useGeneral from 'client/hooks/useGeneral';
import endpoints from 'client/router/endpoints';

import sidebarStyles from 'client/components/Sidebar/styles';
import SidebarLink from 'client/components/Sidebar/SidebarLink';
import SidebarCollapseItem from 'client/components/Sidebar/SidebarCollapseItem';

const Endpoints = React.memo(() =>
  endpoints
    ?.filter(
      ({ authenticated = true, header = false }) => authenticated && !header
    )
    ?.map((endpoint, index) =>
      endpoint.routes ? (
        <SidebarCollapseItem key={`item-${index}`} {...endpoint} />
      ) : (
        <SidebarLink key={`item-${index}`} {...endpoint} />
      )
    )
);

const Sidebar = () => {
  const classes = sidebarStyles();
  const { isOpenMenu, openMenu } = useGeneral();

  return React.useMemo(
    () => (
      <Drawer anchor="left" open={isOpenMenu} onClose={() => openMenu(false)}>
        <Box item className={classes.logo}>
          <img
            className={classes.img}
            src="/static/logo.png"
            alt="Opennebula"
          />
        </Box>
        <Divider />
        <Box className={classes.menu}>
          <List className={classes.list}>
            <Endpoints />
          </List>
        </Box>
      </Drawer>
    ),
    [isOpenMenu, openMenu]
  );
};

export default Sidebar;
