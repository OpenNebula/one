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
import { useAllocateHostMutation } from 'client/features/OneApi/host'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/Host'
import { PATH } from 'client/apps/sunstone/routesOne'
import { T } from 'client/constants'

/**
 * Displays the creation or modification form to a Host.
 *
 * @returns {ReactElement} Host form
 */
function CreateHost() {
  const history = useHistory()

  const { enqueueSuccess } = useGeneralApi()
  const [allocate] = useAllocateHostMutation()

  const onSubmit = async (props) => {
    try {
      const newHostId = await allocate(props).unwrap()
      history.push(PATH.INFRASTRUCTURE.HOSTS.LIST)
      enqueueSuccess(T.SuccessHostCreated, newHostId)
    } catch {}
  }

  return (
    <CreateForm onSubmit={onSubmit} fallback={<SkeletonStepsForm />}>
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  )
}

export default CreateHost
