/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core'
import { useForm, Controller } from 'react-hook-form'

import { Actions, Inputs } from 'client/components/Tabs/Common/Attribute'
import { generateKey } from 'client/utils'

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    '& > *:first-child': {
      flexGrow: 1
    }
  }
})

const AttributeCreateForm = memo(({ handleAdd }) => {
  const classes = useStyles()
  const key = useMemo(() => generateKey(), [])
  const nameInputKey = useMemo(() => `name-${key}`, [key])
  const valueInputKey = useMemo(() => `value-${key}`, [key])

  const { handleSubmit, reset, control, formState } = useForm({
    defaultValues: { [nameInputKey]: '', [valueInputKey]: '' }
  })

  const handleCreateAttribute = async data => {
    const { [nameInputKey]: name, [valueInputKey]: value } = data

    await handleAdd?.(
      String(name).toUpperCase(),
      String(value).toUpperCase()
    )

    reset()
  }

  return (
    <>
      {/* NAME ATTRIBUTE */}
      <Controller
        control={control}
        name={nameInputKey}
        render={fieldProps =>
          <Inputs.Text {...fieldProps} disabled={formState.isSubmitting} />
        }
      />

      {/* VALUE ATTRIBUTE */}
      <div className={classes.wrapper}>
        <Controller
          control={control}
          name={valueInputKey}
          render={fieldProps =>
            <Inputs.Text {...fieldProps} disabled={formState.isSubmitting} />
          }
        />
        <Actions.Add
          name={'action-add'}
          handleClick={handleSubmit(handleCreateAttribute)}
        />
      </div>
    </>
  )
})

AttributeCreateForm.propTypes = {
  handleAdd: PropTypes.func
}

AttributeCreateForm.displayName = 'AttributeCreateForm'

export default AttributeCreateForm
