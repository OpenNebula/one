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
import { useHistory, useLocation } from 'react-router'

import {
  useGeneralApi,
  ServiceTemplateAPI,
  VmGroupAPI,
  HostAPI,
  ImageAPI,
  UserAPI,
  DatastoreAPI,
} from '@FeaturesModule'

import { Typography, Box } from '@mui/material'
import {
  Form,
  PATH,
  TranslateProvider,
  DefaultFormStepper,
  SkeletonStepsForm,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'
const { ServiceTemplate } = Form

const _ = require('lodash')

/**
 * Displays the instantiate form for a Service Template.
 *
 * @returns {ReactElement} Service Template form
 */
export function InstantiateServiceTemplate() {
  const history = useHistory()
  const { state: { ID: templateId, NAME } = {} } = useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [instantiate] = ServiceTemplateAPI.useDeployServiceTemplateMutation()

  const { data: apiTemplateData } =
    ServiceTemplateAPI.useGetServiceTemplateExtendedQuery({
      id: templateId,
    })

  const dataTemplate = _.cloneDeep(apiTemplateData)

  VmGroupAPI.useGetVMGroupsQuery(undefined, {
    refetchOnMountOrArgChange: false,
  })
  HostAPI.useGetHostsQuery(undefined, { refetchOnMountOrArgChange: false })
  ImageAPI.useGetImagesQuery(undefined, { refetchOnMountOrArgChange: false })
  UserAPI.useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  DatastoreAPI.useGetDatastoresQuery(undefined, {
    refetchOnMountOrArgChange: false,
  })

  const onSubmit = async (jsonTemplate) => {
    const { instances = 1 } = jsonTemplate

    try {
      await Promise.all(
        Array.from({ length: instances }, async () =>
          instantiate({
            id: templateId,
            template: jsonTemplate,
          }).unwrap()
        )
      )

      history.push(PATH.INSTANCE.SERVICES.LIST)
      enqueueSuccess(T.SuccessServiceTemplateInitiated, [templateId, NAME])
    } catch {}
  }

  return (
    <>
      <TranslateProvider>
        {templateId && !dataTemplate ? (
          <SkeletonStepsForm />
        ) : (
          <>
            {dataTemplate?.TEMPLATE?.BODY?.logo && (
              <Box
                display="flex"
                alignItems="center" // Aligns typography and image vertically
                justifyContent="flex-start" // Ensures alignment to the left
              >
                <img
                  src={dataTemplate?.TEMPLATE?.BODY?.logo}
                  alt="Custom Logo"
                  style={{
                    width: 50,
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0.5px',
                    backgroundColor: 'transparent',
                  }}
                />
                <Typography variant="h6">
                  {dataTemplate?.TEMPLATE?.BODY?.name}
                </Typography>
              </Box>
            )}
            <ServiceTemplate.InstantiateForm
              initialValues={dataTemplate}
              stepProps={{
                dataTemplate,
              }}
              onSubmit={onSubmit}
              fallback={<SkeletonStepsForm />}
            >
              {(config) => <DefaultFormStepper {...config} />}
            </ServiceTemplate.InstantiateForm>
          </>
        )}
      </TranslateProvider>
    </>
  )
}
