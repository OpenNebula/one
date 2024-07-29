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
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'
import { GroupsTable } from 'client/components/Tables'
import { T } from 'client/constants'
import { string } from 'yup'

export const STEP_ID = 'primaryGroup'

const Content = () => {
  const { setValue } = useFormContext()

  const handleSelectedRow = (row) => {
    setValue(STEP_ID, row?.ID)
  }

  return (
    <GroupsTable
      singleSelect={true}
      onRowClick={handleSelectedRow}
      disableGlobalSort
      pageSize={5}
    />
  )
}

/**
 * User primary group configuration.
 *
 * @returns {object} Primary group configuration step
 */
const PrimaryGroupStep = () => ({
  id: STEP_ID,
  label: T.PrimaryGroup,
  resolver: string().trim().required(),
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default PrimaryGroupStep
