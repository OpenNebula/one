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

import { useListForm } from 'client/hooks'
import { ImagesTable } from 'client/components/Tables'

import {
  SCHEMA
} from 'client/components/Forms/Vm/AttachDiskForm/ImageSteps/ImagesTable/schema'
import { T } from 'client/constants'

export const STEP_ID = 'image'

const ImageStep = () => ({
  id: STEP_ID,
  label: T.Image,
  resolver: () => SCHEMA,
  content: useCallback(
    ({ data, setFormData }) => {
      const selectedImage = data?.[0]

      const {
        handleSelect,
        handleClear
      } = useListForm({ key: STEP_ID, setList: setFormData })

      const handleSelectedRows = rows => {
        const { original } = rows?.[0] ?? {}
        const { ID, NAME, UID, UNAME } = original ?? {}

        const image = {
          IMAGE_ID: ID,
          IMAGE: NAME,
          IMAGE_UID: UID,
          IMAGE_UNAME: UNAME
        }

        ID !== undefined ? handleSelect(image) : handleClear()
      }

      return (
        <ImagesTable
          singleSelect
          onlyGlobalSearch
          onlyGlobalSelectedRows
          initialState={{ selectedRowIds: { [selectedImage?.IMAGE_ID]: true } }}
          onSelectedRowsChange={handleSelectedRows}
        />
      )
    }, [])
})

export default ImageStep
