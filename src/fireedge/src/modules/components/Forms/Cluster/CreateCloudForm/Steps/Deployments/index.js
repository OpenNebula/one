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
import { useMemo } from 'react'
import clsx from 'clsx'
import { Tr } from '@modules/components/HOC'
import { sanitizeAllowingTarget } from '@UtilsModule'
import { useFormContext, useController } from 'react-hook-form'
import styles from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/Deployments/styles'

export const STEP_ID = 'deployments'

const Content = ({ providers, groupedDrivers }) => {
  // Access to the form
  const { control, watch } = useFormContext()

  const {
    field: { value: selectedDeployment, onChange },
    fieldState: { error },
  } = useController({ name: `${STEP_ID}.DEPLOYMENT_CONF`, control })

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
                    __html: sanitizeAllowingTarget`${conf.deploymentDescription}`,
                  }}
                />
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
 * @returns {object} Deployment configurations with associated next steps
 */
const Deployments = ({ providers, groupedDrivers }) => ({
  id: STEP_ID,
  label: T.DeploymentTypes,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content({ providers, groupedDrivers }),
})

Deployments.propTypes = {
  providers: PropTypes.object,
}

export default Deployments
