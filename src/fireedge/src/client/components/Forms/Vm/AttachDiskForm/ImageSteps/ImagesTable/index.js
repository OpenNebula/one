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

import { useListForm } from 'client/hooks'
import { ImagesTable } from 'client/components/Tables'
import { SCHEMA } from 'client/components/Forms/Vm/AttachDiskForm/ImageSteps/ImagesTable/schema'
import { Step } from 'client/utils'
import { T } from 'client/constants'

export const STEP_ID = 'image'

const Content = ({ data, setFormData }) => {
  const { ID } = data?.[0] ?? {}

  const { handleSelect, handleClear } = useListForm({
    key: STEP_ID,
    setList: setFormData,
  })

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    // #6129 #6154. To create an image we only need IMAGE and IMAGE_UNAME attributes. Also, we add datastore and type to show on disk card
    const { NAME, UNAME, DATASTORE, DATASTORE_ID, TYPE } = original
    const selectedImage = { NAME, UNAME, DATASTORE, DATASTORE_ID, TYPE }

    original.ID !== undefined ? handleSelect(selectedImage) : handleClear()
  }

  return (
    <ImagesTable
      singleSelect
      disableGlobalSort
      pageSize={5}
      initialState={{ selectedRowIds: { [ID]: true } }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

/**
 * Renders datatable to select an image form pool.
 *
 * @returns {Step} Image step
 */
const ImageStep = () => ({
  id: STEP_ID,
  label: T.Image,
  resolver: SCHEMA,
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default ImageStep
