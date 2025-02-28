/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { VnTemplateAPI, useGeneralApi, useSystemData } from '@FeaturesModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  PATH,
  Form,
  TranslateProvider,
} from '@ComponentsModule'

import { T } from '@ConstantsModule'
const { VnTemplate } = Form

const _ = require('lodash')

/**
 * Displays the instantiation form for a VM Template.
 *
 * @returns {ReactElement} Instantiation form
 */
export const InstantiateVnTemplate = () => {
  const history = useHistory()
  const { state: { ID: templateId, NAME: templateName } = {} } = useLocation()

  const { enqueueInfo } = useGeneralApi()
  const [instantiate] = VnTemplateAPI.useInstantiateVNTemplateMutation()

  const { adminGroup, oneConfig } = useSystemData()

  const { data: apiTemplateDataExtended, isError } =
    VnTemplateAPI.useGetVNTemplateQuery(
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

  return (
    <TranslateProvider>
      {!dataTemplateExtended || _.isEmpty(oneConfig) ? (
        <SkeletonStepsForm />
      ) : (
        <VnTemplate.InstantiateForm
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
        </VnTemplate.InstantiateForm>
      )}
    </TranslateProvider>
  )
}
