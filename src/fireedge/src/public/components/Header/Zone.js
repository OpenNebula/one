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

import React, { useState, useRef, Fragment } from 'react';
import {
  Button,
  Popper,
  Grow,
  Paper,
  MenuItem,
  MenuList,
  ClickAwayListener,
  Divider
} from '@material-ui/core';
import LanguageIcon from '@material-ui/icons/Language';

import { Translate } from 'client/components/HOC';
import { SignOut, Groups } from 'client/constants';

const Zone = () => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const { current } = anchorRef;

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen);
  };

  const handleClose = e => {
    if (current && current.contains(e.target)) {
      return;
    }
    setOpen(false);
  };

  return (
    <Fragment>
      <Button
        ref={anchorRef}
        color="inherit"
        aria-controls={open ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <LanguageIcon />
        pepe
      </Button>
      <Popper
        open={open}
        anchorEl={current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom'
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList autoFocusItem={open} id="menu-list-grow">
                  <MenuItem onClick={handleClose}>Settings</MenuItem>
                  <Divider />
                  <MenuItem onClick={handleClose}>
                    <Translate word={SignOut} />
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleClose}>
                    <Translate word={Groups} />
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Fragment>
  );
};

Zone.propTypes = {};

Zone.defaultProps = {};

export default Zone;
