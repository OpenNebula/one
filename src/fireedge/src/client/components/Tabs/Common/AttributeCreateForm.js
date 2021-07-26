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
import * as React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core'

import { Actions, Inputs } from 'client/components/Tabs/Common/Attribute'
import { generateKey, fakeDelay } from 'client/utils'

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    '& > *:first-child': {
      flexGrow: 1
    }
  }
})

const AttributeCreateForm = React.memo(({ handleAdd }) => {
  const classes = useStyles()
  const inputNameRef = React.createRef()
  const inputValueRef = React.createRef()

  const key = React.useMemo(() => generateKey(), [])

  const handleCreateAttribute = async () => {
    inputNameRef.current.disabled = true
    inputValueRef.current.disabled = true

    await fakeDelay(2000)
    await handleAdd?.(
      inputValueRef.current.value,
      inputNameRef.current.value
    )

    inputNameRef.current.disabled = false
    inputValueRef.current.disabled = false
    inputNameRef.current.value = ''
    inputValueRef.current.value = ''
  }

  return (
    <>
      {/* NAME ATTRIBUTE */}
      <Inputs.Text name={`name-${key}`} ref={inputNameRef} />

      {/* VALUE ATTRIBUTE */}
      <div className={classes.wrapper}>
        <Inputs.Text name={`value-${key}`} ref={inputValueRef} />
        <Actions.Add
          name={'action-add'}
          handleClick={handleCreateAttribute}
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
