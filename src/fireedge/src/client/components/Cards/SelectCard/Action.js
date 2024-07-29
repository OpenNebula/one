/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { memo } from 'react'
import PropTypes from 'prop-types'

import useFetch from 'client/hooks/useFetch'
import { SubmitButton } from 'client/components/FormControl'

const Action = memo(({ cy, handleClick, stopPropagation, ...props }) => {
  const { fetchRequest, data, loading } = useFetch((e) =>
    Promise.resolve(handleClick?.(e))
  )

  return (
    <SubmitButton
      data-cy={cy}
      isSubmitting={loading}
      onClick={(evt) => {
        stopPropagation && evt?.stopPropagation?.()
        fetchRequest()
      }}
      disabled={!!data}
      {...props}
    />
  )
})

Action.propTypes = {
  cy: PropTypes.string,
  handleClick: PropTypes.func.isRequired,
  icon: PropTypes.node,
  stopPropagation: PropTypes.bool,
}

Action.defaultProps = {
  icon: undefined,
  cy: 'action-card',
}

Action.displayName = 'ActionCard'

export default Action
