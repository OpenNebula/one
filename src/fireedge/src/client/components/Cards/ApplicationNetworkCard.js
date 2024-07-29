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

import { Button, CardActions } from '@mui/material'

import SelectCard from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const ApplicationNetworkCard = memo(
  ({
    value,
    isSelected,
    handleClick,
    handleEdit,
    handleClone,
    handleRemove,
  }) => {
    const { mandatory, name, description } = value

    return (
      <SelectCard
        icon={mandatory ? 'M' : undefined}
        title={name}
        subheader={description}
        isSelected={isSelected}
        handleClick={handleClick}
      >
        <CardActions>
          {handleEdit && (
            <Button
              variant="contained"
              size="small"
              onClick={handleEdit}
              disableElevation
            >
              {Tr(T.Edit)}
            </Button>
          )}
          {handleClone && (
            <Button
              variant="contained"
              size="small"
              onClick={handleClone}
              disableElevation
            >
              {Tr(T.Clone)}
            </Button>
          )}
          {handleRemove && (
            <Button size="small" onClick={handleRemove} disableElevation>
              {Tr(T.Remove)}
            </Button>
          )}
        </CardActions>
      </SelectCard>
    )
  }
)

ApplicationNetworkCard.propTypes = {
  value: PropTypes.shape({
    mandatory: PropTypes.bool,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    type: PropTypes.string,
    id: PropTypes.string,
    extra: PropTypes.string,
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  handleEdit: PropTypes.func,
  handleClone: PropTypes.func,
  handleRemove: PropTypes.func,
}

ApplicationNetworkCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  handleEdit: undefined,
  handleClone: undefined,
  handleRemove: undefined,
}

ApplicationNetworkCard.displayName = 'ApplicationNetworkCard'

export default ApplicationNetworkCard
