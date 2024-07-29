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
import { AddCircledOutline, LogOut } from 'iconoir-react'
import { useMemo } from 'react'

import { useViews } from 'client/features/Auth'

import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { CreateForm } from 'client/components/Forms/Support'
import { Translate } from 'client/components/HOC'
import { RESOURCE_NAMES, SUPPORT_ACTIONS, T } from 'client/constants'
import { useCreateTicketMutation } from 'client/features/OneApi/support'
import { useGetOneVersionQuery } from 'client/features/OneApi/system'
import { useSupportAuthApi } from 'client/features/SupportAuth'

/**
 * Generates the actions to operate resources on VM table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const { view, getResourceView } = useViews()
  const { data: version } = useGetOneVersionQuery()
  const { clearSupportAuthUser } = useSupportAuthApi()
  const [createTicket] = useCreateTicketMutation()

  const supportActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.SUPPORT)?.actions,
        actions: [
          {
            accessor: SUPPORT_ACTIONS.CREATE_DIALOG,
            tooltip: T.SubmitRequest,
            icon: AddCircledOutline,
            dataCy: `support_${SUPPORT_ACTIONS.CREATE_DIALOG}`,
            options: [
              {
                form: CreateForm,
                dialogProps: {
                  title: T.SubmitRequest,
                  dataCy: `modal-${SUPPORT_ACTIONS.CREATE_DIALOG}`,
                },
                onSubmit: () => async (formData) => {
                  const {
                    SUBJECT: subject,
                    BODY: body,
                    SEVERITY: severity,
                  } = formData.template
                  await createTicket({
                    subject,
                    body,
                    version,
                    severity,
                  })
                },
              },
            ],
          },
          {
            accessor: SUPPORT_ACTIONS.LOGOUT,
            dataCy: `support_${SUPPORT_ACTIONS.LOGOUT}`,
            tooltip: T.LogOut,
            icon: LogOut,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: 'LogOut',
                  handleAccept: () => async () => {
                    await clearSupportAuthUser()
                  },
                  children: () => <Translate word={T.DoYouWantProceed} />,
                  dataCy: `modal-${SUPPORT_ACTIONS.LOGOUT}`,
                },
              },
            ],
          },
        ],
      }),
    [view]
  )

  return supportActions
}

export default Actions
