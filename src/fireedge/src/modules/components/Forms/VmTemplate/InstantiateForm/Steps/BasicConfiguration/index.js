/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { useTheme } from '@mui/material'
import { useMemo } from 'react'

import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import {
  SCHEMA,
  SECTIONS,
} from '@modules/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/schema'
import useStyles from '@modules/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/styles'
import { RESOURCE_NAMES, T, VmTemplate } from '@ConstantsModule'
import { useViews } from '@FeaturesModule'
import { getActionsAvailable as getSectionsAvailable } from '@ModelsModule'

let generalFeatures

export const STEP_ID = 'general'

const Content = ({ vmTemplate, oneConfig, adminGroup }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const { view, getResourceView } = useViews()

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

  return (
    <div className={classes.root}>
      {sections.map(({ id, legend, fields }) => (
        <FormWithSchema
          key={id}
          cy={id}
          rootProps={{ className: classes[id] }}
          fields={fields}
          legend={legend}
          saveState={true}
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
const BasicConfiguration = ({ vmTemplate, oneConfig, adminGroup }) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: () => SCHEMA(vmTemplate, generalFeatures),
  optionsValidate: { abortEarly: false },
  content: (props) => Content({ ...props, vmTemplate, oneConfig, adminGroup }),
})

export default BasicConfiguration
