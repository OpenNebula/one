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

import { ReactElement } from 'react'
import { useHistory } from 'react-router'

import { SupportAPI, SystemAPI, useGeneralApi } from '@FeaturesModule'
import { DefaultFormStepper, Form, SkeletonStepsForm } from '@ResourcesModule'

import { PATH, T } from '@ConstantsModule'

const { Support } = Form

/**
 * Displays the creation form for a support ticket.
 *
 * @returns {ReactElement} Support ticket form
 */
export function CreateTicket() {
  const history = useHistory()
  const { enqueueSuccess } = useGeneralApi()
  const { data: version } = SystemAPI.useGetOneVersionQuery()
  const [createTicket] = SupportAPI.useCreateTicketMutation()

  const onSubmit = async (formData) => {
    try {
      const {
        SUBJECT: subject,
        BODY: body,
        SEVERITY: severity,
        ATTACHMENTS: attachments,
      } = formData?.template ?? {}

      await createTicket({
        subject,
        body,
        version,
        severity,
        attachments,
      }).unwrap()

      history.push(PATH.SUPPORT)
      enqueueSuccess(T.SuccessSupportTicketCreated)
    } catch {}
  }

  return (
    <>
      <Support.CreateForm onSubmit={onSubmit} fallback={<SkeletonStepsForm />}>
        {(config) => <DefaultFormStepper {...config} />}
      </Support.CreateForm>
    </>
  )
}
