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
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'

import { DockerHubTagsTable } from 'client/components/Tables'
import { SCHEMA } from 'client/components/Forms/MarketplaceApp/ExportForm/Steps/DockerHubTagsTable/schema'
import { Step } from 'client/utils'
import { T } from 'client/constants'

export const STEP_ID = 'tag'

const Content = ({ data, app }) => {
  const { name } = data?.[0] ?? {}
  const { setValue } = useFormContext()

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    setValue(STEP_ID, original.id !== undefined ? [original] : [])
  }

  return (
    <DockerHubTagsTable
      app={app}
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      initialState={{ selectedRowIds: { [name]: true } }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

/**
 * Step to select the DockerHub tag.
 *
 * @param {object} app - Marketplace App resource
 * @returns {Step} DockerHub tag step
 */
const DockerHubTagStep = (app) => ({
  id: STEP_ID,
  label: T.SelectDockerHubTag,
  resolver: SCHEMA,
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default DockerHubTagStep
