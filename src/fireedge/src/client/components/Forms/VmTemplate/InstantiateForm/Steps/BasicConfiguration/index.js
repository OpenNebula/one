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
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { useAuth } from 'client/features/Auth'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import useStyles from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/styles'

import { STEP_ID as TEMPLATE_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable'
import {
  SCHEMA,
  FIELDS,
} from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/schema'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'
import { T } from 'client/constants'

export const STEP_ID = 'configuration'

const Content = () => {
  const classes = useStyles()
  const { view, getResourceView } = useAuth()
  const { watch } = useFormContext()

  const sections = useMemo(() => {
    const hypervisor = watch(`${TEMPLATE_ID}[0].TEMPLATE.HYPERVISOR`)
    const dialog = getResourceView('VM-TEMPLATE')?.dialogs?.instantiate_dialog
    const sectionsAvailable = getSectionsAvailable(dialog, hypervisor)

    return FIELDS(hypervisor).filter(({ id }) => sectionsAvailable.includes(id))
  }, [view])

  return (
    <div className={classes.root}>
      {sections.map(({ id, legend, fields }) => (
        <FormWithSchema
          key={id}
          className={classes[id]}
          cy={id}
          fields={fields}
          legend={legend}
          id={STEP_ID}
        />
      ))}
    </div>
  )
}

const BasicConfiguration = (initialValues) => {
  const initialHypervisor = initialValues?.TEMPLATE?.HYPERVISOR

  return {
    id: STEP_ID,
    label: T.Configuration,
    resolver: (formData) => {
      const hypervisor =
        formData?.[TEMPLATE_ID]?.[0]?.TEMPLATE?.HYPERVISOR ?? initialHypervisor

      return SCHEMA(hypervisor)
    },
    optionsValidate: { abortEarly: false },
    content: Content,
  }
}

export default BasicConfiguration
