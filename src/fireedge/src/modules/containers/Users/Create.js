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

import { UserAPI, useGeneralApi } from '@FeaturesModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  Form,
  PATH,
  TranslateProvider,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'
const { useAllocateUserMutation } = UserAPI
const { User } = Form

/**
 * Displays the creation form for a User.
 *
 * @returns {ReactElement} User form
 */
export function CreateUser() {
  const history = useHistory()
  const { enqueueSuccess } = useGeneralApi()
  const [createUser] = useAllocateUserMutation()

  const onSubmit = async (props) => {
    try {
      const newUserId = await createUser(props).unwrap()
      history.push(PATH.SYSTEM.USERS.LIST)
      enqueueSuccess(T.SuccessUserCreated, newUserId)
    } catch {}
  }

  return (
    <TranslateProvider>
      <User.CreateForm onSubmit={onSubmit} fallback={<SkeletonStepsForm />}>
        {(config) => <DefaultFormStepper {...config} />}
      </User.CreateForm>
    </TranslateProvider>
  )
}
