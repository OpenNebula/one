/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'

import { useViews } from 'client/features/Auth'
import { useFormContext } from 'react-hook-form'
import { scaleVcpuByCpuFactor } from 'client/models/VirtualMachine'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import useStyles from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/styles'
import {
  SCHEMA,
  SECTIONS,
} from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/schema'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'
import { T, RESOURCE_NAMES, VmTemplate } from 'client/constants'

let generalFeatures

export const STEP_ID = 'configuration'

const Content = ({ vmTemplate, oneConfig, adminGroup }) => {
  const classes = useStyles()
  const { view, getResourceView } = useViews()
  const { getValues, setValue } = useFormContext()

  const resource = RESOURCE_NAMES.VM_TEMPLATE
  const { features, dialogs } = getResourceView(resource)

  const sections = useMemo(() => {
    const hypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR
    const dialog = dialogs?.instantiate_dialog
    const sectionsAvailable = getSectionsAvailable(dialog, hypervisor)

    generalFeatures = features

    return SECTIONS(vmTemplate, features, oneConfig, adminGroup).filter(
      ({ id, required }) => required || sectionsAvailable.includes(id)
    )
  }, [view])

  useEffect(() => {
    if (vmTemplate?.TEMPLATE?.VCPU && features?.cpu_factor) {
      const oldValues = {
        ...getValues(),
      }
      oldValues.configuration.CPU = `${scaleVcpuByCpuFactor(
        vmTemplate.TEMPLATE.VCPU,
        features.cpu_factor
      )}`

      setValue(`${STEP_ID}`, oldValues)
    }
  }, [])

  return (
    <div className={classes.root}>
      {sections.map(({ id, legend, fields }) => (
        <FormWithSchema
          key={id}
          cy={id}
          rootProps={{ className: classes[id] }}
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
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/**
 * Basic configuration about VM Template.
 *
 * @param {VmTemplate} vmTemplate - VM Template
 * @returns {object} Basic configuration step
 */
const BasicConfiguration = ({ data: vmTemplate, oneConfig, adminGroup }) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: () => SCHEMA(vmTemplate, generalFeatures),
  optionsValidate: { abortEarly: false },
  content: (props) => Content({ ...props, vmTemplate, oneConfig, adminGroup }),
})

export default BasicConfiguration
