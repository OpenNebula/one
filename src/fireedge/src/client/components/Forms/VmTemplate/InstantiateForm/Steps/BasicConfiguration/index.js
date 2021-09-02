/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import useStyles from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/styles'

import { STEP_ID as TEMPLATE_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable'
import { SCHEMA, FIELDS } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/schema'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

export const STEP_ID = 'configuration'

const Content = () => {
  const classes = useStyles()
  const { watch } = useFormContext()
  const selectedVmTemplate = useMemo(() => watch(`${TEMPLATE_ID}[0]`), [])

  return (
    <div className={classes.root}>
      <FormWithSchema
        className={classes.information}
        cy='instantiate-vm-template-configuration.information'
        fields={FIELDS.INFORMATION}
        legend={Tr(T.Information)}
        id={STEP_ID}
      />
      <FormWithSchema
        cy='instantiate-vm-template-configuration.capacity'
        fields={FIELDS.CAPACITY}
        legend={Tr(T.Capacity)}
        id={STEP_ID}
      />
      <FormWithSchema
        cy='instantiate-vm-template-configuration.disk'
        fields={FIELDS.DISK(selectedVmTemplate)}
        legend={Tr(T.Disks)}
        id={STEP_ID}
      />
    </div>
  )
}

const BasicConfiguration = () => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: useCallback(Content, [])
})

export default BasicConfiguration
