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
import { ReactElement, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import styles from '@modules/components/Tables/Clusters/CreateAction/styles'
import { Typography, useTheme, Stack, Box } from '@mui/material'
import { Tr } from '@modules/components/HOC'
import { T } from '@ConstantsModule'
import { OpenNebulaLogo } from '@modules/components/Icons'
import { PATH } from '@modules/components/path'
import { Cloud, City, OpenNewWindow } from 'iconoir-react'
import { generateDocLink } from '@UtilsModule'
import { SystemAPI, DriverAPI } from '@FeaturesModule'

const CLUSTER_TYPES = {
  OPENNEBULA: 'OPENNEBULA',
  ONEFORM: 'ONEFORM',
  ONEFORM_ONPREMISE: 'ONEFORM_ONPREMISE',
}

/**
 * Create Cluster Action.
 *
 * @returns {ReactElement} - Create Cluster Action component
 */
const CreateAction = () => {
  const { data: version } = SystemAPI.useGetOneVersionQuery()
  const { data: drivers } = DriverAPI.useGetDriversQuery()
  const onpremDriver =
    drivers?.filter((driver) => driver.name === 'onprem')[0] ?? undefined
  const enabledOnpremDriver = onpremDriver?.state === 'ENABLED'
  const cloudDrivers =
    drivers?.filter((driver) => driver.name !== 'onprem') ?? []
  const enabledCloudDrivers = cloudDrivers.some(
    (driver) => driver.state === 'ENABLED'
  )

  // Get classes
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  // Get history to redirect to forms
  const history = useHistory()

  const onClick = (type) => {
    switch (type) {
      case CLUSTER_TYPES.OPENNEBULA:
        history.push(PATH.INFRASTRUCTURE.CLUSTERS.CREATE)
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
    <Stack direction="column" className={classes.container}>
      <Stack direction="column" className={classes.headerContainer}>
        <Typography className={classes.title}>
          {Tr(T['cluster.create.selection.title'])}
        </Typography>
        <Typography className={classes.subtitle}>
          {Tr(T['cluster.create.selection.subtitle'])}
        </Typography>
      </Stack>
      <Stack className={classes.cardContainer}>
        <Stack
          className={classes.card}
          onClick={() => onClick(CLUSTER_TYPES.OPENNEBULA)}
        >
          <Box className={classes.cardIcon}>
            <OpenNebulaLogo
              width="24px"
              height="24px"
              disabledBetaText
              customColor={theme?.palette.cluster.createCluster.icon}
            />
          </Box>
          <Stack direction="column" className={classes.cardContent}>
            <Typography className={classes.title}>
              {Tr(T['cluster.create.opennebula.title'])}
            </Typography>
            <Typography className={classes.subtitle}>
              {Tr(T['cluster.create.opennebula.subtitle'])}
            </Typography>
            <Typography className={classes.linkContainer}>
              <a
                target="_blank"
                href={generateDocLink(
                  version,
                  'product/cluster_configuration/hosts_and_clusters/cluster_guide'
                )}
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={classes.linkContent}
              >
                {Tr(T.LearnMore)}
              </a>
              <OpenNewWindow className={classes.linkIcon} />
            </Typography>
          </Stack>
        </Stack>

        {onpremDriver && enabledOnpremDriver && (
          <Stack
            direction="column"
            className={classes.card}
            onClick={() => onClick(CLUSTER_TYPES.ONEFORM_ONPREMISE)}
          >
            <Box className={classes.cardIcon}>
              <City className={classes.icon} />
            </Box>
            <Stack direction="column" className={classes.cardContent}>
              <Typography className={classes.title}>
                {Tr(T['cluster.create.onpremise.title'])}
              </Typography>
              <Typography className={classes.subtitle}>
                {Tr(T['cluster.create.onpremise.subtitle'])}
              </Typography>
              <Typography className={classes.linkContainer}>
                <a
                  target="_blank"
                  href={generateDocLink(
                    version,
                    'product/cloud_cluster_provisioning/cloud_cluster_provisions/onprem_cluster'
                  )}
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={classes.linkContent}
                >
                  {Tr(T.LearnMore)}
                </a>
                <OpenNewWindow className={classes.linkIcon} />
              </Typography>
            </Stack>
          </Stack>
        )}

        {cloudDrivers && enabledCloudDrivers && (
          <Stack
            direction="column"
            className={classes.card}
            onClick={() => onClick(CLUSTER_TYPES.ONEFORM)}
          >
            <Box className={classes.cardIcon}>
              <Cloud className={classes.icon} />
            </Box>
            <Stack direction="column" className={classes.cardContent}>
              <Typography className={classes.title}>
                {Tr(T['cluster.create.provider.title'])}
              </Typography>
              <Typography className={classes.subtitle}>
                {Tr(T['cluster.create.provider.subtitle'])}
              </Typography>
              <Typography className={classes.linkContainer}>
                <a
                  target="_blank"
                  href={generateDocLink(
                    version,
                    'product/cloud_cluster_provisioning/cloud_cluster_provisions/'
                  )}
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={classes.linkContent}
                >
                  {Tr(T.LearnMore)}
                </a>
                <OpenNewWindow className={classes.linkIcon} />
              </Typography>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}

export { CreateAction }
