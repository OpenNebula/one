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
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'

import { SCHEMA } from 'client/components/Forms/BackupJob/CreateForm/Steps/VmsTable/schema'
import { VmsTable } from 'client/components/Tables'

import { T } from 'client/constants'
import { Step } from 'client/utils'

export const STEP_ID = 'vms'

const Content = ({ data }) => {
  const { NAME } = data?.[0] ?? {}
  const { setValue } = useFormContext()

  const handleSelectedRows = (rows) => {
    const dataRows = rows?.map?.(({ original }) => original)
    setValue(STEP_ID, dataRows)
  }

  return (
    <VmsTable
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      getRowId={(row) => String(row.NAME)}
      initialState={{
        selectedRowIds: { [NAME]: true },
      }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

/**
 * Step to select the Vms.
 *
 * @param {object} app - BackupJob App resource
 * @returns {Step} Vms step
 */
const VmsStep = (app) => ({
  id: STEP_ID,
  label: T.SelectVms,
  resolver: SCHEMA,
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default VmsStep
