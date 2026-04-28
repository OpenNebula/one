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
import clsx from 'clsx'
import { useMemo } from 'react'
import { sanitize } from '@UtilsModule'
import { Tr } from '@modules/components/HOC'
import { Grid, useTheme, Stack, Typography, Alert } from '@mui/material'
import styles from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/styles'
import { useFormContext, useController } from 'react-hook-form'

export const STEP_ID = 'family'
const defaultTypeForm = 'cluster'

const Content = (families, typeForm) => {
  // Access to the form
  const { control } = useFormContext()
  const {
    field: { value: selectedFamily, onChange },
    fieldState: { error },
  } = useController({ name: `${STEP_ID}.FAMILY`, control })

  // Theme
  const theme = useTheme()
  // Style classes
  const classes = useMemo(() => styles(theme), [theme])

  const onClick = ({ family } = {}) => {
    onChange(family)
  }

  return (
    <>
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        {typeForm === defaultTypeForm
          ? Tr(T['oneks.form.create.family.help.paragraph'])
          : Tr(T['oneks.form.create_nodegroup.family.help.paragraph'])}
      </Alert>
      {error && (
        <Alert
          severity="error"
          variant="outlined"
          className={classes.groupInfo}
        >
          {Tr(T['oneks.form.create.family.error'])}
        </Alert>
      )}
      <Grid container spacing={2} className={classes.container}>
        {families?.map((family) => (
          <Grid item xs={6} key={family.name}>
            <Stack
              direction="column"
              className={clsx(
                classes.card,
                selectedFamily === family.family && classes.cardSelected
              )}
              onClick={() => onClick(family)}
            >
              <Stack direction="column" className={classes.cardContent}>
                <Typography className={classes.title}>{family.name}</Typography>

                <Typography
                  component="div"
                  className={classes.subtitle}
                  dangerouslySetInnerHTML={{
                    __html: sanitize`${family.description}`,
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
 * Family Cluster configuration.
 *
 * @param {object} props - Step props
 * @param {Array} props.families - Step families
 * @param {string} typeForm - type form
 * @returns {object} Family configuration step
 */
const Family = ({ families }, typeForm = defaultTypeForm) => ({
  id: STEP_ID,
  label: T.Family,
  resolver: SCHEMA(),
  optionsValidate: { abortEarly: false },
  content: () => Content(families, typeForm),
})

Family.propTypes = {
  families: PropTypes.array,
}

export default Family
