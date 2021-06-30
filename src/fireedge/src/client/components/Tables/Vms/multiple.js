import * as React from 'react'
import PropTypes from 'prop-types'

import { Tooltip, Typography } from '@material-ui/core'

import { StatusChip } from 'client/components/Status'

const Multiple = ({ tags, limitTags = 1 }) => {
  if (tags?.length === 0) {
    return null
  }

  const more = tags.length - limitTags

  const Tags = tags.splice(0, limitTags).map(tag => (
    <StatusChip key={tag} text={tag} stateColor='#ececec' />
  ))

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'end'
    }}>
      {Tags}
      {more > 0 && (
        <Tooltip arrow
          title={tags.map(tag => (
            <Typography key={tag} variant='subtitle2'>{tag}</Typography>
          ))}
        >
          <span style={{ marginLeft: 6 }}>
            {`+${more} more`}
          </span>
        </Tooltip>
      )}
    </div>
  )
}

Multiple.propTypes = {
  tags: PropTypes.array,
  limitTags: PropTypes.number
}

export default Multiple
