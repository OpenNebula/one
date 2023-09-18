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
import { T } from 'client/constants'
import { array, string } from 'yup'

export const STEP_ID = 'secondaryGroups'

const Content = () => {
  const { setValue } = useFormContext()
  const secondaryGroups = useWatch({ name: STEP_ID })

  const handleSelectedRows = (rows) => {
    const newValue = rows?.map((row) => row?.id) || []
    setValue(STEP_ID, newValue)
  }

  return (
    <GroupsTable
      onSelectedRowsChange={handleSelectedRows}
      disableGlobalSort
      pageSize={5}
      initialState={{
        selectedRowIds: secondaryGroups?.reduce(
          (res, id) => ({ ...res, [id]: true }),
          {}
        ),
      }}
    />
  )
}

/**
 * User secondary groups configuration.
 *
 * @returns {object} Secondary groups configuration step
 */
const SecondaryGroupsStep = () => ({
  id: STEP_ID,
  label: T.SecondaryGroups,
  resolver: array(string().trim()).default(() => []),
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default SecondaryGroupsStep
