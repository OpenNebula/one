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
import { ReactElement } from 'react'
import { useHistory } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import {
  useAllocateImageMutation,
  useUploadImageMutation,
} from 'client/features/OneApi/image'
import { jsonToXml } from 'client/models/Helper'

import { PATH } from 'client/apps/sunstone/routesOne'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/Image'

import { T } from 'client/constants'
import { useSystemData } from 'client/features/Auth'

const _ = require('lodash')

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
function CreateImage() {
  const history = useHistory()
  const [allocate] = useAllocateImageMutation()
  const [upload] = useUploadImageMutation()
  const { enqueueSuccess, enqueueError, uploadSnackbar } = useGeneralApi()
  const { adminGroup, oneConfig } = useSystemData()
  useGetDatastoresQuery(undefined, { refetchOnMountOrArgChange: false })

  const onSubmit = async ({ template, datastore, file }) => {
    let fileUploaded
    if (file) {
      const uploadProcess = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        )
        uploadSnackbar(percentCompleted)
        percentCompleted === 100 && uploadSnackbar(0)
      }
      try {
        fileUploaded = await upload({
          file,
          uploadProcess,
        }).unwrap()

        template.PATH = fileUploaded[0]
      } catch {}
    }

    try {
      if (file && !Array.isArray(fileUploaded)) {
        enqueueError(T.ErrorUpload)
      } else {
        const newTemplateId = await allocate({
          template: jsonToXml(template),
          datastore,
        }).unwrap()
        history.push(PATH.STORAGE.IMAGES.LIST)
        enqueueSuccess(T.SuccessImageCreated, newTemplateId)
      }
    } catch {}
  }

  return !_.isEmpty(oneConfig) ? (
    <CreateForm
      onSubmit={onSubmit}
      stepProps={{
        oneConfig,
        adminGroup,
      }}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  ) : (
    <SkeletonStepsForm />
  )
}

export default CreateImage
