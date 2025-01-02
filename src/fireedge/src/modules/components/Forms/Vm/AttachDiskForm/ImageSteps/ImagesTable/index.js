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
import { useEffect } from 'react'

import { SCHEMA } from '@modules/components/Forms/Vm/AttachDiskForm/ImageSteps/ImagesTable/schema'
import { ImagesTable } from '@modules/components/Tables'
import { T } from '@ConstantsModule'
import { useListForm } from '@HooksModule'
import { Step } from '@UtilsModule'
import { useGeneralApi } from '@FeaturesModule'

export const STEP_ID = 'image'

const Content = ({ data = [], setFormData, selectDiskId }) => {
  const { setFieldPath } = useGeneralApi()

  useEffect(() => {
    const fieldPath = `extra.Storage.${selectDiskId}`
    setFieldPath(fieldPath)
  }, [])

  const { ID: DATA_ID } = data?.[0] ?? {}

  const { handleSelect, handleClear } = useListForm({
    key: STEP_ID,
    setList: setFormData,
    modifiedFields: ['IMAGE', 'IMAGE_UNAME'],
    fieldKey: 'general',
  })

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    // #6129 #6154. To create an image we only need IMAGE and IMAGE_UNAME attributes. Also, we add datastore and type to show on disk card
    const { NAME, UNAME, DATASTORE, DATASTORE_ID, TYPE, ID } = original
    const selectedImage = {
      NAME,
      UNAME,
      DATASTORE,
      DATASTORE_ID,
      TYPE,
      ID,
    }

    original.ID !== undefined ? handleSelect(selectedImage) : handleClear()
  }

  return (
    <ImagesTable.Table
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      initialState={{ selectedRowIds: { [DATA_ID]: true } }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

/**
 * Renders datatable to select an image form pool.
 *
 * @param {object} props - Props
 * @param {object} props.hypervisor - Hypervisor
 * @param {object} props.oneConfig - Config of oned.conf
 * @param {boolean} props.adminGroup - User is admin or not
 * @param {number} props.selectDiskId - Total existing number of disks
 * @returns {Step} Image step
 */
const ImageStep = ({
  hypervisor,
  oneConfig,
  adminGroup,
  selectDiskId,
} = {}) => ({
  id: STEP_ID,
  label: T.Image,
  resolver: SCHEMA,
  content: ({ data, setFormData }) =>
    Content({
      setFormData,
      data,
      hypervisor,
      oneConfig,
      adminGroup,
      selectDiskId,
    }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  selectDiskId: PropTypes.number,
}

export default ImageStep
