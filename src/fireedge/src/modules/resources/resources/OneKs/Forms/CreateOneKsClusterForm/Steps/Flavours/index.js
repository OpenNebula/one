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
import PropTypes from 'prop-types'
import { T } from '@ConstantsModule'
import { SCHEMA } from './schema'
import { useMemo } from 'react'
import { Grid, useTheme, Stack, Typography } from '@mui/material'
import { AlertNotification } from '@ComponentsV2Module'
import styles from '@modules/resources/resources/OneKs/Forms/CreateOneKsClusterForm/Steps/styles'
import { STEP_ID as FAMILY_ID } from '@modules/resources/resources/OneKs/Forms/CreateOneKsClusterForm/Steps/Family'
import { useFormContext, useController } from 'react-hook-form'
import clsx from 'clsx'
import { sanitize } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

export const STEP_ID = 'flavours'
const defaultTypeForm = 'cluster'

const Content = (families, typeForm) => {
  const { translate } = useTranslation()
  // Theme
  const theme = useTheme()
  // Style classes
  const classes = useMemo(() => styles(theme), [theme])

  // Access to the form
  const { control } = useFormContext()
  const {
    field: { value: selectedFamily = 'general' },
  } = useController({ name: `${FAMILY_ID}.FAMILY`, control })

  const {
    field: { value: selectedFlavour, onChange },
    fieldState: { error },
  } = useController({ name: `${STEP_ID}.FLAVOUR`, control })

  const onClick = ({ name } = {}) => {
    onChange(name)
  }

  const flavours =
    families?.find(({ family }) => family === selectedFamily)?.flavours || []

  return (
    <>
      <AlertNotification
        type="primary"
        status="information"
        description={
          typeForm === defaultTypeForm
            ? translate(T['oneks.form.create.flavour.help.parapraph'])
            : translate(T['oneks.form.create_nodegroup.flavour.help.paragraph'])
        }
        isDismissible={false}
        className={classes.groupInfo}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      {error && (
        <AlertNotification
          type="primary"
          status="error"
          description={translate(T['oneks.form.create.flavours.error'])}
          isDismissible={false}
          className={classes.groupInfo}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      )}
      <Grid container spacing={2} className={classes.container}>
        {flavours?.map((flavour) => (
          <Grid item xs={6} key={flavour.name}>
            <Stack
              direction="column"
              className={clsx(
                classes.card,
                selectedFlavour === flavour.name && classes.cardSelected
              )}
              data-cy={flavour.name}
              onClick={() => onClick(flavour)}
            >
              <Stack direction="column" className={classes.cardContent}>
                <Typography className={classes.title}>
                  {flavour.label}
                </Typography>

                <Typography
                  component="div"
                  className={classes.subtitle}
                  dangerouslySetInnerHTML={{
                    __html: sanitize`${flavour.description}`,
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

/**
 * Flavor Cluster configuration.
 *
 * @param {object} props - Step props
 * @param {Array} props.families - Step families
 * @param {string} typeForm - Type of form, cluster or nodegroup
 * @returns {object} Flavor configuration step
 */
const Flavours = ({ families }, typeForm = defaultTypeForm) => ({
  id: STEP_ID,
  label: T.Flavours,
  resolver: SCHEMA(),
  optionsValidate: { abortEarly: false },
  content: () => Content(families, typeForm),
})

Flavours.propTypes = {
  families: PropTypes.array,
}

export default Flavours
