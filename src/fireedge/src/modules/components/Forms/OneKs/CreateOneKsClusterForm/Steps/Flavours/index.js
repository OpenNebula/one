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
import { Grid, useTheme, Alert, Stack, Typography } from '@mui/material'
import styles from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/styles'
import { STEP_ID as FAMILY_ID } from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/Family'
import { useFormContext, useController } from 'react-hook-form'
import clsx from 'clsx'
import { Tr } from '@modules/components/HOC'
import { sanitize } from '@UtilsModule'

export const STEP_ID = 'flavours'
const defaultTypeForm = 'cluster'

const Content = (families, typeForm) => {
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
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        {typeForm === defaultTypeForm
          ? Tr(T['oneks.form.create.flavour.help.parapraph'])
          : Tr(T['oneks.form.create_nodegroup.flavour.help.paragraph'])}
      </Alert>
      {error && (
        <Alert
          severity="error"
          variant="outlined"
          className={classes.groupInfo}
        >
          {Tr(T['oneks.form.create.flavours.error'])}
        </Alert>
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
