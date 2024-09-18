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
import { Redirect, useHistory, useLocation } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import { useGetGroupsQuery } from 'client/features/OneApi/group'
import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetTemplateQuery } from 'client/features/OneApi/vmTemplate'

import {
  useInstantiateVRouterTemplateMutation,
  useAllocateVRouterTemplateMutation,
} from 'client/features/OneApi/vrouterTemplate'

import { PATH } from 'client/apps/sunstone/routesOne'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { InstantiateForm } from 'client/components/Forms/VRTemplate'

import { useSystemData } from 'client/features/Auth'
import { jsonToXml } from 'client/models/Helper'
import { T } from 'client/constants'

const _ = require('lodash')

/**
 * Displays the instantiation form for a VM Template.
 *
 * @returns {ReactElement} Instantiation form
 */
function InstantiateVrTemplate() {
  const history = useHistory()
  const { state: { ID: templateId, NAME: templateName } = {} } = useLocation()

  const { enqueueInfo } = useGeneralApi()
  const [instantiate] = useInstantiateVRouterTemplateMutation()
  const [allocate] = useAllocateVRouterTemplateMutation()

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

  useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetGroupsQuery(undefined, { refetchOnMountOrArgChange: false })

  const onSubmit = async (templates) => {
    try {
      const promises = templates.map(async (t) => {
        t.template = jsonToXml(t)

        /**
         * In allocate request template send only the following info:
         * - Name - Name of the vrouter
         * - Description - Description of the vrouter
         * - Keep alive ID
         * - Keep alive password
         * - NICS
         */
        const allocationResult = await allocate({
          template: jsonToXml({
            NAME: t.vrname,
            DESCRIPTION: t.general?.description,
            KEEPALIVED_ID: t.general?.keepaliveid,
            KEEPALIVED_PASSWORD: t.general?.keepalivepass,
            NIC: t.networking,
          }),
        }).unwrap()

        /**
         * In instantiate request send only the following info:
         * - id - If of the vrouter (created in the previous allocate request)
         * - templateId - Id of the vrouter template
         * - number - Number of virtual machines that are gonna be instantiated
         * - pending - Start virtual machines on hold state
         * - template - XML template only with the user inputs
         */
        return instantiate({
          fromPostbody: t?.initiateFromSelection,
          id: allocationResult,
          templateId: templateId ?? parseInt(t?.id, 10),
          number: t?.number,
          name: t?.name,
          pending: t?.pending,
          template: jsonToXml(t?.user_inputs),
        }).unwrap()
      })

      await Promise.all(promises)

      history.push(PATH.INSTANCE.VROUTERS.LIST)

      const templateInfo = `#${templateId ?? ''} ${templateName ?? ''}`
      enqueueInfo(T.InfoVRTemplateInstantiated, templateInfo ?? '')
    } catch {}
  }

  if (isError) {
    return <Redirect to={PATH.TEMPLATE.VROUTERS.LIST} />
  }

  if (!templateId) {
    return (
      <InstantiateForm
        initialValues={dataTemplateExtended}
        stepProps={{
          dataTemplateExtended,
          oneConfig,
          adminGroup,

          isEmptyTemplate: !templateId,
        }}
        onSubmit={onSubmit}
        fallback={<SkeletonStepsForm />}
      >
        {(config) => <DefaultFormStepper {...config} />}
      </InstantiateForm>
    )
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

        isEmptyTemplate: !templateId,
      }}
      onSubmit={onSubmit}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </InstantiateForm>
  )
}

export default InstantiateVrTemplate
