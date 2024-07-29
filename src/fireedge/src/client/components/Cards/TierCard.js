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

import { Button, CardActions, Badge } from '@mui/material'
import { AppleImac2021 as TierIcon } from 'iconoir-react'

import SelectCard from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const TierCard = memo(({ value, handleEdit, handleRemove, cardProps }) => {
  const { name, cardinality } = value

  return (
    <SelectCard
      observerOff
      icon={
        <Badge
          badgeContent={cardinality}
          color="primary"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <TierIcon />
        </Badge>
      }
      title={name}
      cardProps={cardProps}
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
        {handleRemove && (
          <Button size="small" onClick={handleRemove} disableElevation>
            {Tr(T.Remove)}
          </Button>
        )}
      </CardActions>
    </SelectCard>
  )
})

TierCard.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string,
    cardinality: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  handleEdit: PropTypes.func,
  handleRemove: PropTypes.func,
  cardProps: PropTypes.object,
}

TierCard.defaultProps = {
  value: {},
  handleEdit: undefined,
  handleRemove: undefined,
  cardProps: undefined,
}

TierCard.displayName = 'TierCard'

export default TierCard
