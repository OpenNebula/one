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

import { MenuItem, TextField } from '@material-ui/core';
import { FilterVintage } from '@material-ui/icons';

import useAuth from 'client/hooks/useAuth';
import useOpennebula from 'client/hooks/useOpennebula';
import { Tr } from 'client/components/HOC';
import { FILTER_POOL } from 'client/constants';

const GroupSelect = props => {
  const { filterPool, authUser } = useAuth();
  const { groups } = useOpennebula();

  const defaultValue = React.useMemo(
    () =>
      filterPool === FILTER_POOL.ALL_RESOURCES
        ? FILTER_POOL.ALL_RESOURCES
        : authUser?.GID,
    [filterPool]
  );

  const orderGroups = React.useMemo(
    () =>
      groups
        ?.sort((a, b) => a.ID - b.ID)
        ?.map(({ ID, NAME }) => (
          <MenuItem key={`selector-group-${ID}`} value={String(ID)}>
            {`${ID} - ${String(NAME)}`}
            {authUser?.GID === ID && <FilterVintage fontSize="small" />}
          </MenuItem>
        )),
    [groups]
  );

  return (
    <TextField
      select
      fullWidth
      defaultValue={defaultValue}
      variant="outlined"
      inputProps={{ 'data-cy': 'select-group' }}
      label={Tr('Select a group')}
      FormHelperTextProps={{ 'data-cy': 'select-group-error' }}
      {...props}
    >
      <MenuItem value={FILTER_POOL.ALL_RESOURCES}>{Tr('Show all')}</MenuItem>
      {orderGroups}
    </TextField>
  );
};

GroupSelect.propTypes = {};

GroupSelect.defaultProps = {};

export default GroupSelect;
