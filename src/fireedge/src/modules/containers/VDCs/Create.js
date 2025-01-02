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
import { useHistory, useLocation } from 'react-router'

import { VdcAPI, ZoneAPI, useGeneralApi } from '@FeaturesModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  Form,
  PATH,
  TranslateProvider,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'
const { Vdc } = Form

/**
 * Displays the creation or modification form to a VDC Template.
 *
 * @returns {ReactElement} VDC Template form
 */
export function CreateVDC() {
  const history = useHistory()
  const { state } = useLocation()
  const { ID: vdcId, NAME } = state ?? {}

  const { data: zones = [] } = ZoneAPI.useGetZonesQuery()

  const { enqueueSuccess } = useGeneralApi()
  const [create] = VdcAPI.useCreateVDCMutation()
  const [update] = VdcAPI.useUpdateVDCMutation()

  const onSubmit = async (vdc) => {
    try {
      if (!vdcId) {
        const newVDCId = await create(vdc).unwrap()
        if (newVDCId) {
          history.push(PATH.SYSTEM.VDCS.LIST)
          enqueueSuccess(T.SuccessVDCCreated, newVDCId)
        }
      } else {
        const updatedVDC = await update({ id: vdcId, ...vdc }).unwrap()
        if (updatedVDC) {
          history.push(PATH.SYSTEM.VDCS.LIST)
          enqueueSuccess(T.SuccessVDCUpdated, [vdcId, NAME])
        }
      }
    } catch {}
  }

  return (
    <TranslateProvider>
      {zones.length ? (
        <Vdc.CreateForm
          initialValues={state}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
          stepProps={zones}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </Vdc.CreateForm>
      ) : (
        <SkeletonStepsForm />
      )}
    </TranslateProvider>
  )
}
