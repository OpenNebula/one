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
import { ReactElement } from 'react'
import { useHistory } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import { useAllocateImageMutation } from 'client/features/OneApi/image'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateDockerfileForm } from 'client/components/Forms/Image'
import { PATH } from 'client/apps/sunstone/routesOne'

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
function CreateDockerfile() {
  const history = useHistory()
  const [allocate] = useAllocateImageMutation()
  const { enqueueSuccess } = useGeneralApi()
  useGetDatastoresQuery(undefined, { refetchOnMountOrArgChange: false })

  const onSubmit = async (stepTemplate) => {
    try {
      const newTemplateId = await allocate(stepTemplate).unwrap()
      history.push(PATH.STORAGE.IMAGES.LIST)
      enqueueSuccess(`Image created - #${newTemplateId}`)
    } catch {}
  }

  return (
    <CreateDockerfileForm onSubmit={onSubmit} fallback={<SkeletonStepsForm />}>
      {(config) => <DefaultFormStepper {...config} />}
    </CreateDockerfileForm>
  )
}

export default CreateDockerfile
