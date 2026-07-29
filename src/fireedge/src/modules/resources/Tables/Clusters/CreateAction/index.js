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
import { ReactElement, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { CreateTypeDialog } from '@ComponentsV2Module'
import { useTranslation } from '@ProvidersModule'
import { T, PATH } from '@ConstantsModule'
import { OpenNebulaLogo } from '@modules/resources/Icons'
import { Cloud, City } from 'iconoir-react'
import { DriverAPI } from '@FeaturesModule'

export const CLUSTER_TYPES = {
  OPENNEBULA: 'OPENNEBULA',
  ONEFORM: 'ONEFORM',
  ONEFORM_ONPREMISE: 'ONEFORM_ONPREMISE',
}

const OpenNebulaClusterIcon = () => (
  <OpenNebulaLogo width="24px" height="24px" disabledBetaText />
)

OpenNebulaClusterIcon.displayName = 'OpenNebulaClusterIcon'

const CLUSTER_CREATE_OPTIONS = [
  {
    value: CLUSTER_TYPES.OPENNEBULA,
    dataCy: 'cluster-opennebula',
    icon: OpenNebulaClusterIcon,
    title: T['cluster.create.opennebula.title'],
    subtitle: T['cluster.create.opennebula.subtitle'],
  },
  {
    value: CLUSTER_TYPES.ONEFORM_ONPREMISE,
    dataCy: 'cluster-onpremise',
    icon: City,
    title: T['cluster.create.onpremise.title'],
    subtitle: T['cluster.create.onpremise.subtitle'],
  },
  {
    value: CLUSTER_TYPES.ONEFORM,
    dataCy: 'cluster-cloud',
    icon: Cloud,
    title: T['cluster.create.provider.title'],
    subtitle: T['cluster.create.provider.subtitle'],
  },
]

/**
 * Create Cluster Action.
 *
 * @returns {ReactElement} - Create Cluster Action component
 */
const CreateAction = () => {
  const { translate } = useTranslation()
  const history = useHistory()
  const [selectedType, setSelectedType] = useState(CLUSTER_TYPES.OPENNEBULA)

  const { data: drivers } = DriverAPI.useGetDriversQuery({
    showNotification: false,
  })
  const onpremDriver =
    drivers?.filter((driver) => driver.name === 'onprem')[0] ?? undefined
  const enabledOnpremDriver = onpremDriver?.state === 'ENABLED'
  const cloudDrivers =
    drivers?.filter((driver) => driver.name !== 'onprem') ?? []
  const enabledCloudDrivers = cloudDrivers.some(
    (driver) => driver.state === 'ENABLED'
  )

  const options = useMemo(
    () =>
      CLUSTER_CREATE_OPTIONS.filter(({ value }) => {
        switch (value) {
          case CLUSTER_TYPES.ONEFORM_ONPREMISE:
            return enabledOnpremDriver
          case CLUSTER_TYPES.ONEFORM:
            return enabledCloudDrivers
          default:
            return true
        }
      }).map(({ title, subtitle, ...option }) => ({
        ...option,
        title: translate(title),
        subtitle: translate(subtitle),
      })),
    [enabledCloudDrivers, enabledOnpremDriver, translate]
  )

  const handleCancel = () => history.push(PATH.INFRASTRUCTURE.CLUSTERS.LIST)

  const handleContinue = () => {
    switch (selectedType) {
      case CLUSTER_TYPES.OPENNEBULA:
        history.push(PATH.INFRASTRUCTURE.CLUSTERS.CREATE, {
          createType: CLUSTER_TYPES.OPENNEBULA,
        })
        break
      case CLUSTER_TYPES.ONEFORM:
        history.push(PATH.INFRASTRUCTURE.CLUSTERS.CREATE_CLOUD)
        break
      case CLUSTER_TYPES.ONEFORM_ONPREMISE:
        history.push(PATH.INFRASTRUCTURE.CLUSTERS.CREATE_CLOUD, {
          onpremiseProvider: true,
        })
        break
    }
  }

  return (
    <CreateTypeDialog
      title={translate(T['cluster.create.selection.title'])}
      subtitle={translate(T['cluster.create.selection.subtitle'])}
      options={options}
      selectedValue={selectedType}
      onChange={setSelectedType}
      onCancel={handleCancel}
      onConfirm={handleContinue}
      cancelLabel={translate(T.Cancel)}
      confirmLabel={translate(T.Continue)}
    />
  )
}

export { CreateAction }
