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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { List } from '@modules/components/Tabs/Common'
import { StatusChip, StatusCircle } from '@modules/components/Status'
import { T, Cluster } from '@ConstantsModule'
import {
  timeFromMilliseconds,
  getVirtualOneKsState,
  getValidKeys,
  getVirtualOneKsStateControlPlane,
} from '@ModelsModule'
import Timer from '@modules/components/Timer'
import { Stack, Link } from '@mui/material'
import { Link as RouterLink, generatePath } from 'react-router-dom'
import { PATH } from '@modules/components/path'
import { OneKsAPI } from '@FeaturesModule'
import { arrayToOptions } from '@UtilsModule'
import { find } from 'lodash'

const getFormattedData = (dataObj) =>
  getValidKeys(dataObj).map((key) => ({
    name: T[key] || key,
    canCopy: true,
    showActionsOnHover: true,
    value: dataObj[key] ?? '',
    dataCy: key,
  }))

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Cluster} props.cluster - Cluster resource
 * @param {string} props.endpoint - Endpoint information
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ cluster = {}, endpoint = '' }) => {
  const { ID, NAME, TEMPLATE = {} } = cluster
  const { CLUSTER_BODY = {} } = TEMPLATE

  const { data: families } = OneKsAPI.useGetOneKsFamiliesQuery()

  const kubernetesVersions = useMemo(() => {
    const family = find(families, {
      family: CLUSTER_BODY?.control_plane?.family,
    })

    return family?.supported_k8s_versions || []
  }, [families, CLUSTER_BODY])

  const [update] = OneKsAPI.useUpdateOneKsDocumentMutation()
  const [upgradeKubernetesVersion] =
    OneKsAPI.useUpdateOneKsKubernetesVersionMutation()

  const [time, timeFormat] = useMemo(() => {
    const fromMill = timeFromMilliseconds(+CLUSTER_BODY.registration_time)

    return [fromMill, fromMill.toFormat('ff')]
  }, [CLUSTER_BODY])

  const [stateColor, stateName] = useMemo(() => {
    const { color, name } = getVirtualOneKsState(cluster)

    return [color, name]
  }, [CLUSTER_BODY])

  const [stateColorControlPlane, stateNameControlPlane] = useMemo(() => {
    const { color, name } = getVirtualOneKsStateControlPlane(cluster)

    return [color, name]
  }, [CLUSTER_BODY])

  const privateNetwork = CLUSTER_BODY?.private_network ?? ''
  const publicNetwork = CLUSTER_BODY?.public_network ?? ''
  const vms = CLUSTER_BODY?.control_plane?.vms ?? []
  const userInputs = CLUSTER_BODY?.control_plane?.user_inputs_values ?? {}

  const handleUpdateDocument = async (key = '', value = '') => {
    key &&
      value &&
      (await update({ id: ID, template: { [key.toLowerCase()]: value } }))
  }
  const handleUpdateKubernetesVersion = async (_, value = '') => {
    value &&
      (await upgradeKubernetesVersion({
        id: ID,
        template: { kubernetes_version: value },
      }))
  }

  // Info section
  const info = [
    {
      name: T.ID,
      value: ID,
      dataCy: 'id',
      canCopy: true,
      canEdit: false,
      showActionsOnHover: true,
    },
    {
      name: T.State,
      canEdit: false,
      value: (
        <Stack direction="row" alignItems="center" gap={1}>
          <StatusCircle color={stateColor} />
          <StatusChip dataCy="state" text={stateName} stateColor={stateColor} />
        </Stack>
      ),
      dataCy: 'state',
    },
    {
      name: T.Name,
      value: NAME,
      handleEdit: handleUpdateDocument,
      canEdit: true,
      dataCy: 'name',
      canCopy: true,
      showActionsOnHover: true,
    },
    {
      name: T.KubernetesVersion,
      value: CLUSTER_BODY?.kubernetes_version ?? '',
      canCopy: true,
      canEdit: true,
      handleEdit: handleUpdateKubernetesVersion,
      valueInOptionList: CLUSTER_BODY?.kubernetes_version,
      handleGetOptionList: () =>
        arrayToOptions(kubernetesVersions, { addEmpty: false }),
      dataCy: 'kubernetes-version',
      showActionsOnHover: true,
    },
    {
      name: T.CreationTime,
      value: (
        <span title={timeFormat}>
          <Timer initial={time} />
        </span>
      ),
      canEdit: false,
      dataCy: 'registration-time',
    },
    {
      name: `${T.Flavour}`,
      canCopy: true,
      showActionsOnHover: true,
      value: CLUSTER_BODY?.control_plane?.flavour ?? '',
      dataCy: 'flavour',
    },
  ]

  !Number.isNaN(+publicNetwork) &&
    info.push({
      name: `${T.PublicNetwork}`,
      value: `${publicNetwork}`,
      link:
        !Number.isNaN(+publicNetwork) &&
        generatePath(PATH.NETWORK.VNETS.DETAIL, { id: publicNetwork }),
      dataCy: 'publicNetwork',
    })

  !Number.isNaN(+privateNetwork) &&
    info.push({
      name: `${T.PrivateNetwork}`,
      value: `${privateNetwork}`,
      link:
        !Number.isNaN(+privateNetwork) &&
        generatePath(PATH.NETWORK.VNETS.DETAIL, { id: privateNetwork }),
      dataCy: 'privateNetwork',
    })

  // Control plane section
  const controlPlane = [
    {
      name: T.State,
      canEdit: false,
      value: (
        <Stack direction="row" alignItems="center" gap={1}>
          <StatusCircle color={stateColorControlPlane} />
          <StatusChip
            dataCy="state"
            text={stateNameControlPlane}
            stateColor={stateColorControlPlane}
          />
        </Stack>
      ),
      dataCy: 'state',
    },
    {
      name: `${T.Endpoint}`,
      canCopy: true,
      showActionsOnHover: true,
      value: endpoint || '',
      dataCy: 'endpoint',
    },
  ]

  vms.length &&
    controlPlane.push({
      name: `${T.VirtualMachines}`,
      value: (
        <Stack direction="row" alignItems="center" gap={1}>
          {vms.map((id) => (
            <Link
              key={id}
              component={RouterLink}
              to={generatePath(PATH.INSTANCE.VMS.DETAIL, { id })}
            >
              {id}
            </Link>
          ))}
        </Stack>
      ),
      dataCy: 'virtualMachines',
    })

  controlPlane.push(...getFormattedData(userInputs))

  return (
    <>
      <List title={T.Information} list={info} />
      <List title={T.ControlPlane} list={controlPlane} />
    </>
  )
}

InformationPanel.propTypes = {
  cluster: PropTypes.object,
  endpoint: PropTypes.string,
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
