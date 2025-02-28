/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { DatastoreAPI, useGeneralApi } from '@FeaturesModule'
import { jsonToXml } from '@ModelsModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  PATH,
  Form,
  TranslateProvider,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'
const { Datastore } = Form

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
export function CreateDatastore() {
  const history = useHistory()

  const [allocate] = DatastoreAPI.useAllocateDatastoreMutation()
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
    <TranslateProvider>
      <Datastore.CreateForm
        onSubmit={onSubmit}
        fallback={<SkeletonStepsForm />}
      >
        {(config) => <DefaultFormStepper {...config} />}
      </Datastore.CreateForm>
    </TranslateProvider>
  )
}
