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
/* eslint-disable jsdoc/require-jsdoc */
import { useHistory, useLocation } from 'react-router'
import { Container } from '@mui/material'

import { useGeneralApi } from 'client/features/General'
import { useVmTemplateApi } from 'client/features/One'
import { InstantiateForm } from 'client/components/Forms/VmTemplate'
import { PATH } from 'client/apps/sunstone/routesOne'
import { isDevelopment } from 'client/utils'

function InstantiateVmTemplate() {
  const history = useHistory()
  const { state: template = {} } = useLocation()
  const { ID: templateId } = template ?? {}

  const { enqueueInfo } = useGeneralApi()
  const { instantiate } = useVmTemplateApi()

  const onSubmit = async ([templateSelected = template, templates]) => {
    try {
      const { ID, NAME } = templateSelected

      await Promise.all(templates.map((template) => instantiate(ID, template)))

      history.push(templateId ? PATH.TEMPLATE.VMS.LIST : PATH.INSTANCE.VMS.LIST)
      enqueueInfo(
        `VM Template instantiated x${templates.length} - #${ID} ${NAME}`
      )
    } catch (err) {
      isDevelopment() && console.error(err)
    }
  }

  return (
    <Container style={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <InstantiateForm templateId={templateId} onSubmit={onSubmit} />
    </Container>
  )
}

export default InstantiateVmTemplate
