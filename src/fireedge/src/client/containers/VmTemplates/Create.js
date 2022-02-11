/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useHistory, useLocation } from 'react-router'
import { Container } from '@mui/material'

import { useGeneralApi } from 'client/features/General'
import {
  useUpdateTemplateMutation,
  useAllocateTemplateMutation,
} from 'client/features/OneApi/vmTemplate'
import { CreateForm } from 'client/components/Forms/VmTemplate'
import { PATH } from 'client/apps/sunstone/routesOne'

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
function CreateVmTemplate() {
  const history = useHistory()
  const { state: { ID: templateId, NAME } = {} } = useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [update] = useUpdateTemplateMutation()
  const [allocate] = useAllocateTemplateMutation()

  const onSubmit = async (xmlTemplate) => {
    try {
      if (!templateId) {
        const newTemplateId = await allocate({ template: xmlTemplate }).unwrap()
        history.push(PATH.TEMPLATE.VMS.LIST)
        enqueueSuccess(`VM Template created - #${newTemplateId}`)
      } else {
        await update({ id: templateId, template: xmlTemplate })
        history.push(PATH.TEMPLATE.VMS.LIST)
        enqueueSuccess(`VM Template updated - #${templateId} ${NAME}`)
      }
    } catch {}
  }

  return (
    <Container sx={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <CreateForm templateId={templateId} onSubmit={onSubmit} />
    </Container>
  )
}

export default CreateVmTemplate
