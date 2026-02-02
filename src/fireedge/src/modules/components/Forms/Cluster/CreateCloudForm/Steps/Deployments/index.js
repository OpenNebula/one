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
import { T } from '@ConstantsModule'
import PropTypes from 'prop-types'
import { SCHEMA } from './schema'
import { useTheme, Alert, Grid, Stack, Typography } from '@mui/material'
import { useMemo, useEffect } from 'react'
import clsx from 'clsx'
import { Tr } from '@modules/components/HOC'
import { generateDocLink, sanitize } from '@UtilsModule'
import { useFormContext, useController } from 'react-hook-form'
import { SystemAPI } from '@FeaturesModule'
import { OpenNewWindow } from 'iconoir-react'
import styles from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/Deployments/styles'
import { find } from 'lodash'

export const STEP_ID = 'deployments'

const Content = ({ providers, groupedDrivers, deploymentConfs }) => {
  // Access to the form
  const { control, watch, register, unregister, setValue } = useFormContext()

  const {
    field: { value: selectedDeployment, onChange },
    fieldState: { error },
  } = useController({ name: `${STEP_ID}.DEPLOYMENT_CONF`, control })

  // Gt OpenNebula version
  const { data: version } = SystemAPI.useGetOneVersionQuery()

  // Theme
  const theme = useTheme()

  // Style classes
  const classes = useMemo(() => styles(theme), [theme])

  // Get provider and driver selected
  const providerId = watch(`provider.PROVIDER`)
  const selectedProvider = providers.find((p) => p.ID === providerId)
  const selectedDriver = selectedProvider
    ? groupedDrivers.find(
        (driver) =>
          driver.name === selectedProvider.TEMPLATE.PROVIDER_BODY.driver
      )
    : {}

  const onClick = (conf) => {
    // Update the value in the form
    onChange(conf.deploymentAlias)
  }

  // Register the user inputs that corresponds with the deployment conf
  useEffect(() => {
    // Get the corresponding deployment conf
    const deploymentConf = find(deploymentConfs, {
      deploymentAlias: selectedDeployment,
    })

    // Register the connection values for the driver
    setValue('user_inputs', {})
    unregister('user_inputs')
    deploymentConf?.deploymentUserInputs.forEach((field) =>
      register(`user_inputs.${field.name}`)
    )
  }, [selectedDeployment])

  return (
    <>
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          justifyContent="space-between"
        >
          <div>{Tr(T['oneform.deploymentConf.info'])}</div>
        </Stack>
      </Alert>
      {error && (
        <Alert
          severity="error"
          variant="outlined"
          className={classes.groupInfo}
        >
          {Tr(T['oneform.deploymentConf.error'])}
        </Alert>
      )}
      <Grid container spacing={2} className={classes.container}>
        {selectedDriver?.deploymentConfs?.map((conf) => (
          <Grid item xs={6} key={conf.deploymentName}>
            <Stack
              direction="column"
              className={clsx(
                classes.card,
                selectedDeployment === conf.deploymentAlias &&
                  classes.cardSelected
              )}
              onClick={() => onClick(conf)}
            >
              <Stack direction="column" className={classes.cardContent}>
                <Typography className={classes.title}>
                  {conf.deploymentName}
                </Typography>

                <Typography
                  component="div"
                  className={classes.subtitle}
                  dangerouslySetInnerHTML={{
                    __html: sanitize`${conf.deploymentDescription}`,
                  }}
                />
              </Stack>
              <Stack className={classes.linkContainer}>
                <Typography className={classes.linkText}>
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
          </Grid>
        ))}
      </Grid>
    </>
  )
}

Content.propTypes = {
  providers: PropTypes.object,
  groupedDrivers: PropTypes.array,
  deploymentSteps: PropTypes.array,
  deploymentConfs: PropTypes.array,
}

/**
 * Return the deployemnts conf step.
 *
 * @param {object} props - Step props
 * @param {Array} props.providers - Array of providers
 * @param {Array} props.groupedDrivers - Array of drivers with deployment configurations fields
 * @param {Array} props.deploymentConfs - Array of deployment configurations
 * @returns {object} Deployment configurations with associated next steps
 */
const Deployments = ({ providers, groupedDrivers, deploymentConfs }) => ({
  id: STEP_ID,
  label: T.DeploymentTypes,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content({ providers, groupedDrivers, deploymentConfs }),
})

Deployments.propTypes = {
  providers: PropTypes.object,
}

export default Deployments
