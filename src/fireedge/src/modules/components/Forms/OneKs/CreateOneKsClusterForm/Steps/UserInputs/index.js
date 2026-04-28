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
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { STEP_ID as FAMILY_ID } from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/Family'
import { STEP_ID as FLAVOURS_ID } from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/Flavours'
import { useFormContext, useController } from 'react-hook-form'
import { find } from 'lodash'
import { SCHEMA } from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/UserInputs/schema'
import { Grid, Alert, useTheme, Stack } from '@mui/material'
import { Tr } from '@modules/components/HOC'
import styles from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/styles'
import { useMemo } from 'react'

export const STEP_ID = 'user_inputs'
const defaultTypeForm = 'cluster'

const Content = (families, typeForm) => {
  // Access to the form
  const { control } = useFormContext()

  // Control the driver value
  const {
    field: { value: family = 'general' },
  } = useController({ name: `${FAMILY_ID}.FAMILY`, control: control })
  const {
    field: { value: flavours },
  } = useController({ name: `${FLAVOURS_ID}.FLAVOUR`, control: control })

  const familyConf = find(families, { family })

  // Theme
  const theme = useTheme()
  // Style classes
  const classes = useMemo(() => styles(theme), [theme])

  // Render tabs or form depending if there is layout
  return (
    <>
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          justifyContent="space-between"
        >
          <div>
            {' '}
            {typeForm === defaultTypeForm
              ? Tr(T['oneks.form.create.userinputs.help.paragraph'])
              : Tr(T['oneks.form.create_nodegroup.userinputs.help.paragraph'])}
          </div>
        </Stack>
      </Alert>
      <Grid mt={2} container className={classes.container}>
        <Grid item xs={12}>
          <FormWithSchema
            key={`user-inputs`}
            cy={`user-inputs`}
            id={STEP_ID}
            fields={familyConf?.fields?.[flavours] || []}
          />
        </Grid>
      </Grid>
    </>
  )
}

/**
 * User Inputs configuration.
 *
 * @param {object} props - Step props
 * @param {Array} props.families - Step families
 * @param {string} typeForm - type form
 * @returns {object} User Inputs configuration step
 */
const UserInputs = ({ families }, typeForm = defaultTypeForm) => ({
  id: STEP_ID,
  label: T.UserInputs,
  resolver: SCHEMA(families),
  optionsValidate: { abortEarly: false },
  content: () => Content(families, typeForm),
})

UserInputs.propTypes = {
  families: PropTypes.array,
  setFormData: PropTypes.func,
}

Content.propTypes = { deploymentConfs: PropTypes.array }

export default UserInputs
