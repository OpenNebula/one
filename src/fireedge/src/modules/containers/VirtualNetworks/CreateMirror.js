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
import { ReactElement, useRef } from 'react'
import { generatePath, Redirect, useHistory, useParams } from 'react-router-dom'
import {
  AlertNotification,
  DefaultFormStepper,
  SkeletonStepsForm,
} from '@ComponentsModule'
import { PATH, T, VN_DRIVERS } from '@ConstantsModule'
import { VnAPI, VmAPI, useGeneralApi } from '@FeaturesModule'
import { VirtualNetwork } from '@ResourcesModule'
import { jsonToXml } from '@UtilsModule'

const { mirrorList, networkNics } = VirtualNetwork.Forms

/**
 * Displays the creation or modification form for a Virtual Network mirror.
 *
 * @returns {ReactElement} Port Mirroring form
 */
export function CreateVirtualNetworkMirror() {
  const history = useHistory()
  const { id, mirrorId } = useParams()
  const isUpdate = mirrorId != null
  const invalidId = !/^\d+$/.test(id) || (isUpdate && !/^\d+$/.test(mirrorId))
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const submitting = useRef(false)
  const [createMirror] = VnAPI.useCreateVNetMirrorMutation()
  const [updateMirror] = VnAPI.useUpdateVNetMirrorMutation()
  const [refreshVMs] = VmAPI.useLazyGetVmsQuery()
  const {
    data: vnet,
    isLoading,
    isError,
  } = VnAPI.useGetVNetworkQuery(
    { id },
    { skip: invalidId, refetchOnMountOrArgChange: true }
  )
  const mirror = [vnet?.TEMPLATE?.MIRROR ?? []]
    .flat()
    .find((item) => String(item?.MIRROR_ID) === mirrorId)
  const supportedDriver = [
    VN_DRIVERS.ovswitch,
    VN_DRIVERS.ovswitch_vxlan,
  ].includes(vnet?.VN_MAD ?? vnet?.TEMPLATE?.VN_MAD)

  const returnToNetwork = (selectedMirrorId) =>
    history.push(generatePath(PATH.NETWORK.VNETS.DETAIL, { id }), {
      ID: id,
      NAME: vnet?.NAME,
      tab: 'port_mirroring',
      mirrorId: selectedMirrorId,
    })

  const validateSources = async (ports) => {
    if (!ports.length) return true

    const currentVMs = await refreshVMs({ extended: true }).unwrap()
    const available = ports.every((port) => {
      const [vmId, nicId] = port.split(':')
      const vm = currentVMs.find(({ ID }) => String(ID) === vmId)

      return networkNics(vm, id).some(({ NIC_ID }) => String(NIC_ID) === nicId)
    })
    if (!available) enqueueError(T.MirrorSourceUnavailable)

    return available
  }

  const onSubmit = async (attributes) => {
    if (submitting.current || vnet?.LOCK || !supportedDriver) return
    submitting.current = true

    try {
      const ports = isUpdate ? [] : mirrorList(attributes.PORTS)
      if (!(await validateSources(ports))) return

      const template = jsonToXml({ MIRROR: attributes })
      const result = isUpdate
        ? await updateMirror({ id, mirrorId, template, replace: 0 }).unwrap()
        : await createMirror({ id, template }).unwrap()

      enqueueSuccess(isUpdate ? T.MirrorUpdated : T.MirrorCreated)
      returnToNetwork(isUpdate ? mirrorId : result)
    } catch {
      // Keep the form values available after a failed request.
    } finally {
      submitting.current = false
    }
  }

  if (invalidId) return <Redirect to={PATH.NETWORK.VNETS.LIST} />
  if (isLoading) return <SkeletonStepsForm />
  if (isError || !vnet) {
    return (
      <AlertNotification
        type="primary"
        status="error"
        description={T.NotFound}
        isDismissible={false}
      />
    )
  }
  if (isUpdate && !mirror) {
    return (
      <AlertNotification
        type="primary"
        status="error"
        description={T.MirrorGone}
        isDismissible={false}
      />
    )
  }
  if (!supportedDriver) {
    return (
      <AlertNotification
        type="primary"
        status="error"
        description={T.MirrorUnsupportedDriver}
        isDismissible={false}
      />
    )
  }

  return (
    <VirtualNetwork.Forms.MirrorForm
      key={`${id}:${mirrorId ?? 'create'}`}
      initialValues={isUpdate ? mirror : undefined}
      stepProps={{ vnet, isUpdate }}
      onSubmit={onSubmit}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => (
        <DefaultFormStepper
          {...config}
          update={isUpdate}
          onCancel={() => returnToNetwork(mirrorId)}
        />
      )}
    </VirtualNetwork.Forms.MirrorForm>
  )
}
