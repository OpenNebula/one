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
import { useInstantiateTemplateMutation } from 'client/features/OneApi/vmTemplate'
import { InstantiateForm } from 'client/components/Forms/VmTemplate'
import { PATH } from 'client/apps/sunstone/routesOne'

/**
 * Displays the instantiation form for a VM Template.
 *
 * @returns {ReactElement} Instantiation form
 */
function InstantiateVmTemplate() {
  const history = useHistory()
  const { state: { ID: templateId } = {} } = useLocation()

  const { enqueueInfo } = useGeneralApi()
  const [instantiate] = useInstantiateTemplateMutation()

  const onSubmit = async ([templateSelected, templates]) => {
    try {
      const { ID, NAME } = templateSelected
      const templatesWithId = templates.map((t) => ({ id: ID, ...t }))

      await Promise.all(templatesWithId.map(instantiate))

      templateId
        ? history.push(PATH.TEMPLATE.VMS.LIST)
        : history.push(PATH.INSTANCE.VMS.LIST)

      const total = templates.length
      enqueueInfo(`VM Template instantiated x${total} - #${ID} ${NAME}`)
    } catch {}
  }

  return (
    <Container sx={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <InstantiateForm templateId={templateId} onSubmit={onSubmit} />
    </Container>
  )
}

export default InstantiateVmTemplate
