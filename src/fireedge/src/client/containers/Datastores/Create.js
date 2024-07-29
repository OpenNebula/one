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
import { useAllocateDatastoreMutation } from 'client/features/OneApi/datastore'
import { jsonToXml } from 'client/models/Helper'

import { PATH } from 'client/apps/sunstone/routesOne'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/Datastore'
import { T } from 'client/constants'

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
function CreateDatastore() {
  const history = useHistory()

  const [allocate] = useAllocateDatastoreMutation()
  const { enqueueSuccess } = useGeneralApi()

  const onSubmit = async ({ template, cluster }) => {
    try {
      const newTemplateId = await allocate({
        template: jsonToXml(template),
        cluster,
      }).unwrap()
      history.push(PATH.STORAGE.DATASTORES.LIST)
      enqueueSuccess(T.SuccessDatastoreCreated, newTemplateId)
    } catch {}
  }

  return (
    <CreateForm onSubmit={onSubmit} fallback={<SkeletonStepsForm />}>
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  )
}

export default CreateDatastore
