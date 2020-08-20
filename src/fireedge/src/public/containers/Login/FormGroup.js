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
import { Box, Button } from '@material-ui/core';
import { useForm, Controller } from 'react-hook-form';

import GroupSelect from 'client/components/FormControl/GroupSelect';
import ButtonSubmit from 'client/components/FormControl/SubmitButton';

function FormGroup({ classes, onBack, onSubmit }) {
  const { control, handleSubmit } = useForm();

  return (
    <Box
      component="form"
      className={classes?.form}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Controller as={<GroupSelect />} control={control} name="group" />
      <Button onClick={onBack}>Logout</Button>
      <ButtonSubmit
        data-cy="login-group-button"
        isSubmitting={false}
        label="Enter"
      />
    </Box>
  );
}

FormGroup.propTypes = {};

FormGroup.defaultProps = {};

export default FormGroup;
