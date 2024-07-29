/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { SCHEMA } from './schema'
import { Stack, FormControl, Divider } from '@mui/material'
import NetworkingSection from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking'

import CustomAttributesSection from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/customAttributes'

import ScheduleActionsSection from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/scheduledActions'

import { FormWithSchema } from 'client/components/Forms'

import { T } from 'client/constants'
import { ADVANCED_PARAMS_FIELDS } from './advancedParams/schema'

export const STEP_ID = 'extra'

const Content = () =>
  useMemo(
    () => (
      <Stack
        display="grid"
        gap="1em"
        sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
      >
        <NetworkingSection stepId={STEP_ID} />
        <CustomAttributesSection stepId={STEP_ID} />
        <FormControl
          component="fieldset"
          sx={{ width: '100%', gridColumn: '1 / -1' }}
        >
          <FormWithSchema
            id={STEP_ID}
            legend={T.AdvancedParams}
            fields={ADVANCED_PARAMS_FIELDS}
            rootProps={{ sx: { m: 0 } }}
          />
          <Divider />
        </FormControl>
        <ScheduleActionsSection />
      </Stack>
    ),
    [STEP_ID]
  )

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
}

/**
 *@returns {Component} - Extra step
 */
const Extra = () => ({
  id: STEP_ID,
  label: T.Extra,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

export default Extra
