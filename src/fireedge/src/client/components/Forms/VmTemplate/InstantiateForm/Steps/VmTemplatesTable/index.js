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
import { useCallback } from 'react'
import PropTypes from 'prop-types'

import { useListForm } from 'client/hooks'
import { useVmTemplateApi } from 'client/features/One'
import { VmTemplatesTable } from 'client/components/Tables'

import { SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable/schema'
import { STEP_ID as CONFIGURATION_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration'
import { SCHEMA as CONFIGURATION_SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/schema'
import { T } from 'client/constants'

export const STEP_ID = 'template'

const Content = ({ data, setFormData }) => {
  const selectedTemplate = data?.[0]
  const { getVmTemplate } = useVmTemplateApi()

  const { handleSelect, handleClear } = useListForm({
    key: STEP_ID,
    setList: setFormData
  })

  const handleSelectedRows = async rows => {
    const { original: templateSelected } = rows?.[0] ?? {}
    const { ID } = templateSelected ?? {}

    if (!ID) return handleClear()

    const extendedTemplate = ID ? await getVmTemplate(ID, { extended: true }) : {}

    const configuration = CONFIGURATION_SCHEMA
      .cast(extendedTemplate?.TEMPLATE, { stripUnknown: true })

    setFormData(prev => ({ ...prev, [CONFIGURATION_ID]: configuration }))
    handleSelect(extendedTemplate)
  }

  return (
    <VmTemplatesTable
      singleSelect
      onlyGlobalSearch
      onlyGlobalSelectedRows
      initialState={{ selectedRowIds: { [selectedTemplate?.ID]: true } }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func
}

const VmTemplateStep = () => ({
  id: STEP_ID,
  label: T.VMTemplate,
  resolver: SCHEMA,
  content: useCallback(Content, [])
})

export default VmTemplateStep
