/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

import React, { useState, useMemo } from 'react';
import { TextField, Grid, MenuItem } from '@material-ui/core';
import Commands from 'server/utils/constants/commands';
import { Translate } from 'client/components/HOC';
import InputCode from 'client/components/FormControl/InputCode';
import ResponseForm from 'client/containers/TestApi/ResponseForm';

const TestApi = () => {
  const [name, setName] = useState('acl.addrule');
  const [response, setResponse] = useState('');

  const handleChangeCommand = evt => setName(evt?.target?.value);
  const handleChangeResponse = res => setResponse(res);
  return (
    <Grid container direction="row" spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          select
          variant="outlined"
          label={<Translate word="Select request" />}
          value={name}
          onChange={handleChangeCommand}
        >
          <MenuItem value="">
            <Translate word="none" />
          </MenuItem>
          {useMemo(() =>
            Object.keys(Commands)?.map(
              commandName => (
                <MenuItem
                  key={`selector-request-${commandName}`}
                  value={commandName}
                >
                  {commandName}
                </MenuItem>
              ),
              []
            )
          )}
        </TextField>
        {name && name !== '' && (
          <ResponseForm
            handleChangeResponse={handleChangeResponse}
            command={{ name, ...Commands[name] }}
          />
        )}
      </Grid>
      <Grid item xs={12} md={6}>
        <InputCode code={response} />
      </Grid>
    </Grid>
  );
};

export default TestApi;
