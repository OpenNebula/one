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
import { useHistory, useLocation } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import {
  useUpdateTemplateMutation,
  useAllocateTemplateMutation,
  useGetTemplateQuery,
} from 'client/features/OneApi/vmTemplate'
import { useGetVMGroupsQuery } from 'client/features/OneApi/vmGroup'
import { useGetHostsQuery } from 'client/features/OneApi/host'
import { useGetImagesQuery } from 'client/features/OneApi/image'
import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/VmTemplate'
import { PATH } from 'client/apps/sunstone/routesOne'

import { jsonToXml, xmlToJson } from 'client/models/Helper'

import { useSystemData } from 'client/features/Auth'

import {
  addTempInfo,
  deleteTempInfo,
  deleteRestrictedAttributes,
} from 'client/utils'

const _ = require('lodash')

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

  const { adminGroup, oneConfig } = useSystemData()

  const { data: apiTemplateDataExtended } = useGetTemplateQuery(
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

  useGetVMGroupsQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetHostsQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetImagesQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetDatastoresQuery(undefined, { refetchOnMountOrArgChange: false })

  const onSubmit = async (xmlTemplate) => {
    try {
      if (!templateId) {
        const newTemplateId = await allocate({ template: xmlTemplate }).unwrap()
        history.push(PATH.TEMPLATE.VMS.LIST)
        enqueueSuccess(`VM Template created - #${newTemplateId}`)
      } else {
        /**
         * #6154: Consideration about resolving this issue:
         *
         * When the user is a non admin user, we have to delete the restricted attributes of the DISK to avoid errors.
         *
         * Core behaviour: The core will fail if in the template there is a restricted attribute that has a different value before modify it.
         * EXAMPLES:
         * - If you add a restricted attribute on the template
         * - If you remove a restricted attribute on the template
         * - If you modify the value of a restricted attribute on the template
         *
         * Core will not fail if you send a restricted attribute in the template without modify him.
         * EXAMPLES:
         * - If your template has a restricted attribute with value 1024 and you send the same attribute with 1024 value, core will not fail
         *
         * Fireedge Sunstone behaviour: The app has a different behaviour between the DISK attribute of a template and another attributes like NIC, CONTEXT, GRAPHICS,... The sequence when you're updating a template is the following:
         * 1. Get the info of the template from the core with extended value false. That returns only what the template has on the core.
         * 2. Get the info of the template from the core with extended value true. That returns the info of the template plus the info of the disk (only disk, not NIC or another attributes).
         * 3. When the template is update, DISK could have some attributes that are not in the template, so this could cause a failure.
         *
         * To resolve the issue we delete restricted attributes if there are not in template when the user is non admin . This can be done because the user can modify the restricted attributes (as part of this issue, the schemas has a read only attribute if the field is restricted)
         *
         * We delete this info onto onSubmit function becasue we need to get the original tempalte without modify. So there is need a hook that we can't do on tranformBeforeSubmit.
         * Also, the data that is an input parameter of the CreateForm is the data with extended values, so it's no possible to to that using initualValues on transformBeforeSubmit.
         *
         */

        // #6154: Delete restricted attributes (if there are not on the original template)
        const jsonFinal = adminGroup
          ? xmlToJson(xmlTemplate)
          : deleteRestrictedAttributes(
              xmlToJson(xmlTemplate),
              dataTemplate?.TEMPLATE,
              oneConfig?.VM_RESTRICTED_ATTR
            )

        // #6154: Delete unique identifier to compare on submit items that exists at the beginning of the update
        if (!adminGroup) {
          deleteTempInfo(jsonFinal)
        }

        // Transform json to xml
        const xmlFinal = jsonToXml(jsonFinal)

        await update({ id: templateId, template: xmlFinal }).unwrap()
        history.push(PATH.TEMPLATE.VMS.LIST)
        enqueueSuccess(`VM Template updated - #${templateId} ${NAME}`)
      }
    } catch {}
  }

  return templateId &&
    (!dataTemplateExtended || !dataTemplate || _.isEmpty(oneConfig)) ? (
    <SkeletonStepsForm />
  ) : (
    <CreateForm
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
    </CreateForm>
  )
}

export default CreateVmTemplate
