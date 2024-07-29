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
import AdvancedOptions, {
  STEP_ID as STEP_ADVANCED,
} from 'client/components/Forms/Vm/AttachDiskForm/ImageSteps/AdvancedOptions'
import ImagesTable, {
  STEP_ID as STEP_IMAGE,
} from 'client/components/Forms/Vm/AttachDiskForm/ImageSteps/ImagesTable'
import { createSteps, mapUserInputs } from 'client/utils'
import { store } from 'client/sunstone'
import {
  setModifiedFields,
  setFieldPath,
} from 'client/features/General/actions'

const Steps = createSteps([ImagesTable, AdvancedOptions], {
  transformInitialValue: (initialValue) => {
    const {
      IMAGE,
      IMAGE_ID,
      IMAGE_UID,
      IMAGE_UNAME,
      IMAGE_STATE,
      ...diskProps
    } = initialValue ?? {}

    store.dispatch(setFieldPath(`extra.Storage.${diskProps?.DISK_ID}`))

    return {
      [STEP_IMAGE]: [
        {
          ...diskProps,
          NAME: IMAGE,
          ID: IMAGE_ID,
          UID: IMAGE_UID,
          UNAME: IMAGE_UNAME,
          STATE: IMAGE_STATE,
        },
      ],
      [STEP_ADVANCED]: initialValue,
    }
  },
  transformBeforeSubmit: (formData) => {
    const { [STEP_IMAGE]: [image] = [], [STEP_ADVANCED]: advanced } = formData
    const { ID, NAME, UID, UNAME, STATE, SIZE, ...imageProps } = image ?? {}

    imageProps?.DATASTORE_ID &&
      store.dispatch(setModifiedFields({}, { batch: false }))

    return {
      ...imageProps,
      ...mapUserInputs(advanced),
      IMAGE: NAME,
      IMAGE_ID: ID,
      IMAGE_UID: UID,
      IMAGE_UNAME: UNAME,
      IMAGE_STATE: STATE,
    }
  },
})

export default Steps
