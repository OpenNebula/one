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
import { useFormContext, useWatch } from 'react-hook-form'

import { GroupsTable } from 'client/components/Tables'
import { SCHEMA } from './schema'

import { T } from 'client/constants'
import { Step } from 'client/utils'

export const STEP_ID = 'groups'

const Content = () => {
  const { setValue } = useFormContext()
  const groups = useWatch({ name: STEP_ID })

  const selectedRowIds =
    groups?.reduce((res, id) => ({ ...res, [id]: true }), {}) || []

  const handleSelectedRows = (rows) => {
    const newValue = rows?.map((row) => row.original.ID) || []

    setValue(STEP_ID, newValue)
  }

  return (
    <GroupsTable
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      initialState={{ selectedRowIds }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

/**
 * Step to select the Group.
 *
 * @param {object} app - VDC App resource
 * @returns {Step} Group step
 */
const GroupsStep = (app) => ({
  id: STEP_ID,
  label: T.SelectGroup,
  resolver: SCHEMA,
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default GroupsStep
