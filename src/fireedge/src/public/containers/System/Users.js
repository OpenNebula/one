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

import React, { useEffect } from 'react';

import { makeStyles, Card, CardContent, Typography } from '@material-ui/core';

import useOpennebula from 'client/hooks/useOpennebula';

const useStyles = makeStyles({
  root: {
    minWidth: 275
  },
  title: {
    fontSize: 14
  }
});

function Users() {
  const classes = useStyles();
  const { users, getUsers } = useOpennebula();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  console.log(users);
  return (
    <div>
      <Card className={classes.root}>
        <CardContent>
          <Typography className={classes.title} gutterBottom>
            Word of the Day
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

Users.propTypes = {};

Users.defaultProps = {};

export default Users;
