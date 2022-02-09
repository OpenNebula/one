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
import PropTypes from 'prop-types'
import makeStyles from '@mui/styles/makeStyles'

import { useListForm } from 'client/hooks'
import { useVmTemplateApi } from 'client/features/One'
import { VmTemplatesTable } from 'client/components/Tables'

import { SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable/schema'
import { STEP_ID as CONFIGURATION_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration'
import { SCHEMA as CONFIGURATION_SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration/schema'
import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration'
import { SCHEMA as EXTRA_SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'
import { T } from 'client/constants'

export const STEP_ID = 'template'

const useStyles = makeStyles({
  body: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
  },
})

const Content = ({ data, setFormData }) => {
  const classes = useStyles()
  const selectedTemplate = data?.[0]
  const { getVmTemplate } = useVmTemplateApi()

  const { handleSelect, handleClear } = useListForm({
    key: STEP_ID,
    setList: setFormData,
  })

  const handleSelectedRows = async (rows) => {
    const { original: templateSelected } = rows?.[0] ?? {}
    const { ID } = templateSelected ?? {}

    if (!ID) return handleClear()

    const extendedTemplate = ID
      ? await getVmTemplate(ID, { extended: true })
      : {}

    setFormData((prev) => ({
      ...prev,
      // needs hypervisor to strip unknown attributes
      [CONFIGURATION_ID]: CONFIGURATION_SCHEMA?.({
        [STEP_ID]: [extendedTemplate],
      }).cast(extendedTemplate?.TEMPLATE, { stripUnknown: true }),
      [EXTRA_ID]: EXTRA_SCHEMA(extendedTemplate?.TEMPLATE?.HYPERVISOR).cast(
        extendedTemplate?.TEMPLATE,
        { stripUnknown: true }
      ),
    }))

    handleSelect(extendedTemplate)
  }

  return (
    <VmTemplatesTable
      singleSelect
      onlyGlobalSearch
      onlyGlobalSelectedRows
      classes={classes}
      initialState={{ selectedRowIds: { [selectedTemplate?.ID]: true } }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

const VmTemplateStep = () => ({
  id: STEP_ID,
  label: T.SelectVmTemplate,
  resolver: SCHEMA,
  content: Content,
})

export default VmTemplateStep
