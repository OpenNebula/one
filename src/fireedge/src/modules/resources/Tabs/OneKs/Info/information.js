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
import { List } from '@modules/resources/Tabs/Common'
import { StatusChip, StatusCircle } from '@modules/resources/Status'
import { T, Cluster, PATH } from '@ConstantsModule'
import {
  timeFromMilliseconds,
  getVirtualOneKsState,
  getValidKeys,
  getVirtualOneKsStateControlPlane,
} from '@ModelsModule'
import Timer from '@modules/resources/Timer'
import { Stack, Link } from '@mui/material'
import { Link as RouterLink, generatePath } from 'react-router-dom'
import { OneKsAPI } from '@FeaturesModule'
import { arrayToOptions, isValidOneKsResourceId } from '@UtilsModule'
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
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ cluster = {} }) => {
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

  const endpoint = useMemo(
    () => CLUSTER_BODY?.control_plane?.endpoint || '',
    [CLUSTER_BODY]
  )

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

  isValidOneKsResourceId(publicNetwork) &&
    info.push({
      name: `${T.PublicNetwork}`,
      value: `${publicNetwork}`,
      link: generatePath(PATH.NETWORK.VNETS.DETAIL, {
        id: String(publicNetwork),
      }),
      dataCy: 'publicNetwork',
    })

  isValidOneKsResourceId(privateNetwork) &&
    info.push({
      name: `${T.PrivateNetwork}`,
      value: `${privateNetwork}`,
      link: generatePath(PATH.NETWORK.VNETS.DETAIL, {
        id: String(privateNetwork),
      }),
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
      value: endpoint,
      dataCy: 'endpoint',
    },
  ]

  const validVms = vms.filter(isValidOneKsResourceId)

  validVms.length &&
    controlPlane.push({
      name: `${T.VirtualMachines}`,
      value: (
        <Stack direction="row" alignItems="center" gap={1}>
          {validVms.map((id) => (
            <Link
              key={id}
              component={RouterLink}
              to={generatePath(PATH.INSTANCE.VMS.DETAIL, { id: String(id) })}
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
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
