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
import { useFormContext } from 'react-hook-form'
import { useState } from 'react'

import { DatastoresTable } from '@modules/components/Tables'
import { SCHEMA } from '@modules/components/Forms/Image/CloneForm/Steps/DatastoresTable/schema'

import { Step } from '@UtilsModule'
import { T } from '@ConstantsModule'

export const STEP_ID = 'datastore'

const Content = ({ data }) => {
  // eslint-disable-next-line no-unused-vars
  const [_, triggerNewRender] = useState(undefined)
  const { setValue } = useFormContext()

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}
    triggerNewRender(original)

    setValue(STEP_ID, original.ID !== undefined ? [original] : [])
  }

  return (
    <DatastoresTable.Table
      disableGlobalSort
      pageSize={5}
      getRowId={(row) => String(row.NAME)}
      initialState={{
        filters: [{ id: 'type', value: 'FILE' }],
      }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

/**
 * Step to select the Datastore.
 *
 * @param {object} app - Marketplace App resource
 * @returns {Step} Datastore step
 */
const DatastoreStep = (app) => ({
  id: STEP_ID,
  label: T.SelectDatastoreImage,
  resolver: SCHEMA,
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default DatastoreStep
