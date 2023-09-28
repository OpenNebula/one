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
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useWatch } from 'react-hook-form'

import { useViews } from 'client/features/Auth'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import useStyles from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/styles'

import {
  SCHEMA,
  SECTIONS,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/schema'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'
import { generateKey } from 'client/utils'
import { T, RESOURCE_NAMES, VmTemplate } from 'client/constants'

let generalFeatures

export const STEP_ID = 'general'

const Content = ({ isUpdate, oneConfig, adminGroup }) => {
  const classes = useStyles()
  const { view, getResourceView } = useViews()
  const hypervisor = useWatch({ name: `${STEP_ID}.HYPERVISOR` })

  const sections = useMemo(() => {
    const resource = RESOURCE_NAMES.VM_TEMPLATE
    const { features, dialogs } = getResourceView(resource)
    const dialog = dialogs?.create_dialog
    const sectionsAvailable = getSectionsAvailable(dialog, hypervisor)

    generalFeatures = features

    return (
      SECTIONS(hypervisor, isUpdate, features, oneConfig, adminGroup)
        .filter(
          ({ id, required }) => required || sectionsAvailable.includes(id)
        )
        // unique keys to avoid duplicates
        .map((section) => ({ key: generateKey(), ...section }))
    )
  }, [view, hypervisor])

  return (
    <div className={classes.root}>
      {sections.map(({ key, id, ...section }) => (
        <FormWithSchema
          key={key}
          id={STEP_ID}
          cy={`${STEP_ID}-${id}`}
          rootProps={{ className: classes[id] }}
          {...section}
        />
      ))}
    </div>
  )
}

/**
 * General configuration about VM Template.
 *
 * @param {VmTemplate} vmTemplate - VM Template
 * @returns {object} General configuration step
 */
const General = ({
  dataTemplateExtended: vmTemplate,
  oneConfig,
  adminGroup,
}) => {
  const isUpdate = vmTemplate?.NAME
  const initialHypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR

  return {
    id: STEP_ID,
    label: T.General,
    resolver: (formData) => {
      const hypervisor = formData?.[STEP_ID]?.HYPERVISOR ?? initialHypervisor

      return SCHEMA(hypervisor, isUpdate, generalFeatures)
    },
    optionsValidate: { abortEarly: false },
    content: () => Content({ isUpdate, oneConfig, adminGroup }),
  }
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default General
