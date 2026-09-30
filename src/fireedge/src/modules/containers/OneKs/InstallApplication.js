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
import { Redirect, useHistory, useParams } from 'react-router-dom'

import {
  AlertNotification,
  DefaultFormStepper,
  SkeletonStepsForm,
} from '@ComponentsModule'
import { PATH, T } from '@ConstantsModule'
import { OneKsAPI, useGeneralApi } from '@FeaturesModule'
import { OneKs } from '@ResourcesModule'

const getErrorMessage = ({ data, message } = {}) =>
  (typeof data === 'string' ? data : data?.data?.message ?? data?.message) ??
  message ??
  T.SomethingWrong

/**
 * Displays the application installation form for a OneKE cluster.
 *
 * @returns {ReactElement} Application installation form
 */
export function InstallOneKsApplication() {
  const { id } = useParams()
  const history = useHistory()
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [installApplication] = OneKsAPI.useInstallOneKsApplicationMutation()
  const {
    data: applications = [],
    isLoading,
    isError,
  } = OneKsAPI.useGetOneKsApplicationsQuery({ cluster_id: id })

  if (Number.isNaN(+id)) return <Redirect to={PATH.ONEKS.LIST} />

  const onSubmit = async (template) => {
    try {
      await installApplication({ id, template }).unwrap()
      enqueueSuccess(T.SuccessApplicationInstallStarted)
      history.push(PATH.ONEKS.LIST, { selectedClusterId: id })
    } catch (error) {
      enqueueError(T.ErrorApplicationInstallation, [getErrorMessage(error)])
    }
  }

  if (isLoading) return <SkeletonStepsForm />

  if (isError || applications.length === 0) {
    return (
      <AlertNotification
        type="primary"
        status="error"
        description={T.ApplicationCatalogueUnavailable}
        isDismissible={false}
      />
    )
  }

  return (
    <OneKs.Forms.InstallApplicationForm
      onSubmit={onSubmit}
      stepProps={{ applications, clusterId: id }}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </OneKs.Forms.InstallApplicationForm>
  )
}
