/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
  VnTemplate,
} from '@ResourcesModule'

import { T, PATH } from '@ConstantsModule'
const _ = require('lodash')

/**
 * Displays the instantiation form for a VM Template.
 *
 * @returns {ReactElement} Instantiation form
 */
export const InstantiateVnTemplate = () => {
  const history = useHistory()
  const { state: { ID: templateId, NAME: templateName, returnTo } = {} } =
    useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [instantiate] = VnTemplateAPI.useInstantiateVNTemplateMutation()

  const { adminGroup, oneConfig } = useSystemData()

  const { data: apiTemplateDataExtended, isError } =
    VnTemplateAPI.useGetVNTemplateQuery(
      { id: templateId, extended: true },
      { skip: templateId === undefined }
    )

  const dataTemplateExtended = _.cloneDeep(apiTemplateDataExtended)

  const onSubmit = async (template) => {
    try {
      await instantiate(template).unwrap()
      history.push(returnTo ?? PATH.NETWORK.VN_TEMPLATES.LIST)

      const templateInfo = `#${templateId} ${templateName}`
      enqueueSuccess(T.InfoVNTemplateInstantiated, [templateInfo])
    } catch {}
  }

  const handleCancel = () => {
    history.push(returnTo ?? PATH.NETWORK.VN_TEMPLATES.LIST)
  }

  if (!templateId || isError) {
    return <Redirect to={PATH.NETWORK.VN_TEMPLATES.LIST} />
  }

  return (
    <>
      {!dataTemplateExtended || _.isEmpty(oneConfig) ? (
        <SkeletonStepsForm />
      ) : (
        <VnTemplate.Forms.InstantiateForm
          initialValues={dataTemplateExtended}
          stepProps={{
            data: dataTemplateExtended,
            dataTemplateExtended,
            oneConfig,
            adminGroup,
          }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => (
            <DefaultFormStepper
              {...config}
              {...(returnTo && { onCancel: handleCancel })}
            />
          )}
        </VnTemplate.Forms.InstantiateForm>
      )}
    </>
  )
}
