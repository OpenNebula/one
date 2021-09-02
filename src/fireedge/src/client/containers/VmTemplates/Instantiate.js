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
import { useHistory, useParams } from 'react-router'

import { Container } from '@material-ui/core'

import { useGeneralApi } from 'client/features/General'
import { useVmTemplateApi } from 'client/features/One'
import { InstantiateForm } from 'client/components/Forms/VmTemplate'
import { PATH } from 'client/apps/sunstone/routesOne'

function InstantiateVmTemplate () {
  const history = useHistory()
  const { templateId } = useParams()
  const initialValues = { template: { ID: templateId } }

  const { enqueueInfo } = useGeneralApi()
  const { instantiate } = useVmTemplateApi()

  const onSubmit = async formData => {
    const {
      template: [{ ID, NAME }] = [],
      configuration: { name, instances, ...configuration } = {}
    } = formData

    await Promise.all([...new Array(instances)]
      .map((_, idx) => {
        const replacedName = name?.replace(/%idx/gi, idx)
        const data = { ...configuration, name: replacedName }

        return instantiate(ID, data)
      })
    )

    console.log(formData)

    history.push(templateId ? PATH.TEMPLATE.VMS.LIST : PATH.INSTANCE.VMS.LIST)
    enqueueInfo(`VM Template instantiated x${instances} - ${NAME}`)
  }

  return (
    <Container style={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <InstantiateForm initialValues={initialValues} onSubmit={onSubmit} />
    </Container>
  )
}

export default InstantiateVmTemplate
