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
import { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useWatch, useFormContext } from 'react-hook-form'
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
import { useGeneralApi } from 'client/features/General'
import { set } from 'lodash'

let generalFeatures

export const STEP_ID = 'general'

const Content = ({
  isUpdate,
  oneConfig,
  adminGroup,
  setFormData,
  isVrouter,
}) => {
  const classes = useStyles()
  const { view, getResourceView } = useViews()
  const hypervisor = useWatch({ name: `${STEP_ID}.HYPERVISOR` })

  const { setFieldPath } = useGeneralApi()
  useEffect(() => {
    setFieldPath(`general`)
  }, [])

  const { getValues, setValue } = useFormContext()

  // Create watch for vcpu
  const vcpuWatch = useWatch({
    name: 'general.VCPU',
    defaultValue: getValues('general.VCPU'),
  })

  // Synchronize general.VCPU and extra.VCPU (they're the same field but we need to create two to validate in both steps the vcpu)
  useEffect(() => {
    // Set value in formContext
    setValue('extra.VCPU', vcpuWatch)

    // Set value in formData (extra.VCPU is in another step, so formData won't be updated if we don't force to update) -> components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa/index.js
    setFormData((prevState) => {
      set(prevState, 'extra.VCPU', vcpuWatch)

      return prevState
    })
  }, [vcpuWatch])

  const sections = useMemo(() => {
    const resource = RESOURCE_NAMES.VM_TEMPLATE
    const { features, dialogs } = getResourceView(resource)
    const dialog = dialogs?.create_dialog
    const sectionsAvailable = getSectionsAvailable(dialog, hypervisor)

    generalFeatures = features

    return (
      SECTIONS(hypervisor, isUpdate, features, oneConfig, adminGroup, isVrouter)
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
          saveState={true}
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
  apiTemplateDataExtended: vmTemplate,
  oneConfig,
  adminGroup,
  isVrouter = false,
}) => {
  const isUpdate = !!vmTemplate?.NAME
  const initialHypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR

  return {
    id: STEP_ID,
    label: T.General,
    resolver: (formData) => {
      const hypervisor = formData?.[STEP_ID]?.HYPERVISOR ?? initialHypervisor

      return SCHEMA(hypervisor, isUpdate, generalFeatures)
    },
    optionsValidate: { abortEarly: false },
    content: (props) =>
      Content({
        ...props,
        isUpdate,
        oneConfig,
        adminGroup,
        isVrouter,
      }),
  }
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  setFormData: PropTypes.func,
  isVrouter: PropTypes.bool,
}

export default General
