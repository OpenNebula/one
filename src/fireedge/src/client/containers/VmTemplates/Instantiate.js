/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { useHistory, useLocation, Redirect } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import {
  useInstantiateTemplateMutation,
  useGetTemplateQuery,
} from 'client/features/OneApi/vmTemplate'
import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetGroupsQuery } from 'client/features/OneApi/group'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { InstantiateForm } from 'client/components/Forms/VmTemplate'
import { PATH } from 'client/apps/sunstone/routesOne'

import {
  addTempInfo,
  deleteTempInfo,
  deleteRestrictedAttributes,
} from 'client/utils'
import { useSystemData } from 'client/features/Auth'
import { jsonToXml, xmlToJson } from 'client/models/Helper'

const _ = require('lodash')

/**
 * Displays the instantiation form for a VM Template.
 *
 * @returns {ReactElement} Instantiation form
 */
function InstantiateVmTemplate() {
  const history = useHistory()
  const { state: { ID: templateId, NAME: templateName } = {} } = useLocation()

  const { enqueueInfo } = useGeneralApi()
  const [instantiate] = useInstantiateTemplateMutation()

  const { adminGroup, oneConfig } = useSystemData()

  const { data: apiTemplateDataExtended, isError } = useGetTemplateQuery(
    { id: templateId, extended: true },
    { skip: templateId === undefined }
  )

  const { data: apiTemplateData } = useGetTemplateQuery(
    { id: templateId, extended: false },
    { skip: templateId === undefined }
  )

  const dataTemplateExtended = _.cloneDeep(apiTemplateDataExtended)
  const dataTemplate = _.cloneDeep(apiTemplateData)

  // #6154: Add an unique identifier to compare on submit items that exists at the beginning of the update
  if (!adminGroup) addTempInfo(dataTemplate, dataTemplateExtended)

  useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetGroupsQuery(undefined, { refetchOnMountOrArgChange: false })

  const onSubmit = async (templates) => {
    try {
      await Promise.all(
        templates.map((t) => {
          // #6154: Consideration about resolving this issue -> Read comment on src/client/containers/VmTemplates/Create.js

          // #6154: Delete restricted attributes (if there are not on the original template)
          const jsonFinal = adminGroup
            ? xmlToJson(t.template)
            : deleteRestrictedAttributes(
                xmlToJson(t?.template),
                dataTemplate?.TEMPLATE,
                oneConfig?.VM_RESTRICTED_ATTR
              )

          // #6154: Delete unique identifier to compare on submit items that exists at the beginning of the update
          if (!adminGroup) {
            deleteTempInfo(jsonFinal)
          }

          // Transform json to xml
          const xmlFinal = jsonToXml(jsonFinal)

          // Modify template
          t.template = xmlFinal

          return instantiate(t).unwrap()
        })
      )

      history.push(PATH.INSTANCE.VMS.LIST)

      const total = templates.length
      const templateInfo = `#${templateId} ${templateName}`
      enqueueInfo(`VM Template instantiated x${total} - ${templateInfo}`)
    } catch {}
  }

  if (!templateId || isError) {
    return <Redirect to={PATH.TEMPLATE.VMS.LIST} />
  }

  return !dataTemplateExtended || !dataTemplate || _.isEmpty(oneConfig) ? (
    <SkeletonStepsForm />
  ) : (
    <InstantiateForm
      initialValues={dataTemplateExtended}
      stepProps={{
        dataTemplateExtended,
        oneConfig,
        adminGroup,
      }}
      onSubmit={onSubmit}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </InstantiateForm>
  )
}

export default InstantiateVmTemplate
