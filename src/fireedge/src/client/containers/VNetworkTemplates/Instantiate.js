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
import {
  useGetVNTemplateQuery,
  useInstantiateVNTemplateMutation,
} from 'client/features/OneApi/networkTemplate'

import { PATH } from 'client/apps/sunstone/routesOne'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { InstantiateForm } from 'client/components/Forms/VNTemplate'

import { useSystemData } from 'client/features/Auth'
import { T } from 'client/constants'

const _ = require('lodash')

/**
 * Displays the instantiation form for a VM Template.
 *
 * @returns {ReactElement} Instantiation form
 */
const InstantiateVnTemplate = () => {
  const history = useHistory()
  const { state: { ID: templateId, NAME: templateName } = {} } = useLocation()

  const { enqueueInfo } = useGeneralApi()
  const [instantiate] = useInstantiateVNTemplateMutation()

  const { adminGroup, oneConfig } = useSystemData()

  const { data: apiTemplateDataExtended, isError } = useGetVNTemplateQuery(
    { id: templateId },
    { skip: templateId === undefined }
  )

  const dataTemplateExtended = _.cloneDeep(apiTemplateDataExtended)

  const onSubmit = async (template) => {
    try {
      await instantiate(template).unwrap()
      history.push(PATH.NETWORK.VN_TEMPLATES.LIST)

      const templateInfo = `#${templateId} ${templateName}`
      enqueueInfo(T.InfoVNTemplateInstantiated, [templateInfo])
    } catch {}
  }

  if (!templateId || isError) {
    return <Redirect to={PATH.NETWORK.VN_TEMPLATES.LIST} />
  }

  return !dataTemplateExtended || _.isEmpty(oneConfig) ? (
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

export default InstantiateVnTemplate
