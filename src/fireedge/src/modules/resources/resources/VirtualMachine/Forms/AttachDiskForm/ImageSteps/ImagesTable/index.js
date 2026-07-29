/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFormContext } from 'react-hook-form'

import { FormWithSchema } from '@ComponentsV2Module'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/VirtualMachine/Forms/AttachDiskForm/ImageSteps/ImagesTable/schema'
import { T } from '@ConstantsModule'
import { imageTable } from '@ModelsModule'
import { Step } from '@UtilsModule'
import { useGeneralApi } from '@FeaturesModule'

export const STEP_ID = 'image'

const getSelectedImage = (image = {}) => {
  const { ID, NAME, UID, UNAME, STATE, DATASTORE, DATASTORE_ID, TYPE } = image

  return { ID, NAME, UID, UNAME, STATE, DATASTORE, DATASTORE_ID, TYPE }
}

const Content = ({ selectDiskId }) => {
  const { setFieldPath, setModifiedFields } = useGeneralApi()
  const { setValue } = useFormContext()
  const imagesRef = useRef([])

  useEffect(() => {
    const fieldPath = `extra.Storage.${selectDiskId}`
    setFieldPath(fieldPath)
  }, [])

  const model = useMemo(
    () => ({
      columns: () =>
        imageTable
          .columns()
          .filter(({ id }) => !['owner', 'group', 'labels'].includes(id)),
      dataCy: imageTable.dataCy,
      useData: (...args) => {
        const result = imageTable.useData(...args)
        imagesRef.current = [].concat(result?.data ?? [])

        return result
      },
    }),
    []
  )

  const updateImageValue = useCallback(
    (image) => {
      setValue(STEP_ID, image ? getSelectedImage(image) : { ID: undefined }, {
        shouldDirty: true,
        shouldTouch: true,
      })
    },
    [setValue]
  )

  const handleSelectImage = useCallback(
    (selected) => {
      const selectedId = []
        .concat(selected ?? [])
        .filter(Boolean)
        .at(-1)
      const selectedImage = imagesRef.current.find(
        ({ ID }) => String(ID) === String(selectedId)
      )

      updateImageValue(selectedImage)

      if (selectedImage) {
        setModifiedFields(
          {
            general: {
              IMAGE: true,
              IMAGE_UNAME: true,
              IMAGE_ID: true,
            },
          },
          { batch: true }
        )
      }
    },
    [setModifiedFields, updateImageValue]
  )

  return (
    <FormWithSchema
      id={STEP_ID}
      cy={STEP_ID}
      fields={FIELDS({ model, onSelectImage: handleSelectImage })}
    />
  )
}

/**
 * Renders datatable to select an image form pool.
 *
 * @param {object} props - Props
 * @param {number} props.selectDiskId - Total existing number of disks
 * @returns {Step} Image step
 */
const ImageStep = ({ selectDiskId } = {}) => ({
  id: STEP_ID,
  label: T.Image,
  resolver: SCHEMA,
  content: () =>
    Content({
      selectDiskId,
    }),
})

Content.propTypes = {
  selectDiskId: PropTypes.number,
}

export default ImageStep
