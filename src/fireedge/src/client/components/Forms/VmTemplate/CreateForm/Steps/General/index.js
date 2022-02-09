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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useWatch } from 'react-hook-form'

import { useAuth } from 'client/features/Auth'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import useStyles from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/styles'

import { HYPERVISOR_FIELD } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/informationSchema'
import {
  SCHEMA,
  SECTIONS,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/schema'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'
import { T } from 'client/constants'

export const STEP_ID = 'general'

const Content = ({ isUpdate }) => {
  const classes = useStyles()
  const { view, getResourceView } = useAuth()
  const hypervisor = useWatch({ name: `${STEP_ID}.HYPERVISOR` })

  const sections = useMemo(() => {
    const dialog = getResourceView('VM-TEMPLATE')?.dialogs?.create_dialog
    const sectionsAvailable = getSectionsAvailable(dialog, hypervisor)

    return SECTIONS(hypervisor, isUpdate).filter(
      ({ id, required }) => required || sectionsAvailable.includes(id)
    )
  }, [view, hypervisor])

  return (
    <div className={classes.root}>
      <FormWithSchema
        cy={`${STEP_ID}-hypervisor`}
        fields={[HYPERVISOR_FIELD]}
        legend={T.Hypervisor}
        id={STEP_ID}
      />
      {sections.map(({ id, ...section }) => (
        <FormWithSchema
          key={id}
          id={STEP_ID}
          className={classes[id]}
          cy={`${STEP_ID}-${id}`}
          {...section}
        />
      ))}
    </div>
  )
}

const General = (initialValues) => {
  const isUpdate = initialValues?.NAME
  const initialHypervisor = initialValues?.TEMPLATE?.HYPERVISOR

  return {
    id: STEP_ID,
    label: T.General,
    resolver: (formData) => {
      const hypervisor = formData?.[STEP_ID]?.HYPERVISOR ?? initialHypervisor

      return SCHEMA(hypervisor, isUpdate)
    },
    optionsValidate: { abortEarly: false },
    content: () => Content({ isUpdate }),
  }
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
}

export default General
