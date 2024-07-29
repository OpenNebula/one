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

import { jsonToXml } from 'client/models/Helper'
import { useGeneralApi } from 'client/features/General'
import {
  useAllocateImageMutation,
  useUploadImageMutation,
} from 'client/features/OneApi/image'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/File'
import { PATH } from 'client/apps/sunstone/routesOne'
import { T } from 'client/constants'

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
function CreateFile() {
  const history = useHistory()
  const [allocate] = useAllocateImageMutation()
  const [upload] = useUploadImageMutation()
  const { enqueueSuccess, uploadSnackbar } = useGeneralApi()
  useGetDatastoresQuery(undefined, { refetchOnMountOrArgChange: false })

  const onSubmit = async ({ template, datastore, file }) => {
    if (file) {
      const uploadProcess = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        )
        uploadSnackbar(percentCompleted)
        percentCompleted === 100 && uploadSnackbar(0)
      }
      try {
        const fileUploaded = await upload({
          file,
          uploadProcess,
        }).unwrap()
        template.PATH = fileUploaded[0]
      } catch {}
    }

    try {
      const newTemplateId = await allocate({
        template: jsonToXml(template),
        datastore,
      }).unwrap()
      history.push(PATH.STORAGE.FILES.LIST)
      enqueueSuccess(T.SuccessFileCreated, newTemplateId)
    } catch {}
  }

  return (
    <CreateForm onSubmit={onSubmit} fallback={<SkeletonStepsForm />}>
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  )
}

export default CreateFile
