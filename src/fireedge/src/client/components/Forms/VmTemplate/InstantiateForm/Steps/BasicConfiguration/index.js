/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo } from 'react'
import PropTypes from 'prop-types'

import { useViews } from 'client/features/Auth'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import useStyles from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/styles'

import {
  SCHEMA,
  SECTIONS,
} from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/schema'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'
import { T, RESOURCE_NAMES, VmTemplate } from 'client/constants'

export const STEP_ID = 'configuration'

const Content = ({ vmTemplate }) => {
  const classes = useStyles()
  const { view, getResourceView } = useViews()

  const sections = useMemo(() => {
    const hypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR
    const resource = RESOURCE_NAMES.VM_TEMPLATE
    const dialog = getResourceView(resource)?.dialogs?.instantiate_dialog
    const sectionsAvailable = getSectionsAvailable(dialog, hypervisor)

    return SECTIONS(vmTemplate).filter(({ id }) =>
      sectionsAvailable.includes(id)
    )
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

Content.propTypes = {
  vmTemplate: PropTypes.object,
}

/**
 * Basic configuration about VM Template.
 *
 * @param {VmTemplate} vmTemplate - VM Template
 * @returns {object} Basic configuration step
 */
const BasicConfiguration = (vmTemplate) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: () => SCHEMA(vmTemplate),
  optionsValidate: { abortEarly: false },
  content: (props) => Content({ ...props, vmTemplate }),
})

export default BasicConfiguration
