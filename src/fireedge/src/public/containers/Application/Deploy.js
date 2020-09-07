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

import {
  makeStyles,
  Card,
  Chip,
  CardContent,
  Typography,
  LinearProgress,
  Box
} from '@material-ui/core';

import useGeneral from 'client/hooks/useGeneral';
import useOpennebula from 'client/hooks/useOpennebula';

const useStyles = makeStyles({
  card: {
    minWidth: 275,
    marginBottom: '2em'
  },
  title: {
    fontSize: 14
  }
});

function ApplicationDeploy() {
  const classes = useStyles();
  const { isLoading } = useGeneral();
  const { users, groups, getUsers } = useOpennebula();

  useEffect(() => {
    if (!isLoading) {
      getUsers();
    }
  }, [getUsers]);

  const getGroupById = findId => groups?.find(({ ID }) => ID === findId);

  return (
    <>
      {isLoading && <LinearProgress style={{ width: '100%' }} />}
      {users?.map(({ NAME, GROUPS }, index) => (
        <Card key={`user-${index}`} className={classes.card}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Typography className={classes.title}>{NAME}</Typography>
              {[GROUPS?.ID ?? []].flat().map(ID => {
                const group = getGroupById(ID);
                return group ? (
                  <Chip
                    style={{ margin: '0 0.5em' }}
                    key={`group-${index}-${ID}`}
                    size="small"
                    color="primary"
                    clickable
                    label={group.NAME}
                  />
                ) : null;
              })}
            </Box>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

ApplicationDeploy.propTypes = {};

ApplicationDeploy.defaultProps = {};

export default ApplicationDeploy;
