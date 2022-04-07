/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { memo, useState } from 'react'
import PropTypes from 'prop-types'
import { Stack, Typography, Box } from '@mui/material'

import { rowStyles } from 'client/components/Tables/styles'

import {
  isoDateToMilliseconds,
  timeFromMilliseconds,
} from 'client/models/Helper'
import { prettyBytes } from 'client/utils'

const LIMIT_IMAGES_TO_SHOW = 3
const CHARS_DIGEST = 12

const TagImage = memo(({ image }) => {
  const { digest = 'Unknown', os, architecture, size } = image

  const fullOs = [os, architecture].filter(Boolean).join('/')
  const prettySize = prettyBytes(size, 'B', 2)

  const trimmedDigest = String(digest)
    .replace('sha256:', '')
    .substring(0, CHARS_DIGEST)

  return (
    <Stack
      spacing={2}
      direction="row"
      flexWrap="nowrap"
      alignItems="center"
      justifyContent="space-between"
      sx={{ '&:hover': { bgcolor: 'secondary.light' } }}
    >
      <Typography
        title="digest"
        variant="subtitle2"
        flexGrow={1.25}
        width={100}
      >
        {trimmedDigest}
      </Typography>
      <Typography
        title="OS/Architecture"
        variant="subtitle2"
        flexGrow={1.25}
        width={80}
        textAlign="start"
      >
        {fullOs}
      </Typography>
      <Typography
        title="Size"
        variant="subtitle2"
        textAlign="end"
        flexGrow={1.25}
        width={80}
      >
        {prettySize}
      </Typography>
    </Stack>
  )
})

const Row = ({ original, value: _, ...props }) => {
  const [showMore, setShowMore] = useState(() => false)
  const classes = rowStyles()
  const { name, tag_last_pushed: lastPushed, images } = original

  const time = timeFromMilliseconds(isoDateToMilliseconds(lastPushed))
  const timeAgo = lastPushed ? `Last pushed ${time.toRelative()}` : ''

  const handleShowMore = (evt) => {
    evt.stopPropagation()
    setShowMore(true)
  }

  return (
    <div {...props}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component="span">{name}</Typography>
        </div>
        <div className={classes.caption}>
          <span title={time.toFormat('ff')} className="full-width">
            {timeAgo}
          </span>
        </div>
        {images?.length > 0 && (
          <Box flexBasis="100%" mt={1}>
            {showMore ? (
              images?.map((image) => (
                <TagImage key={image.digest} image={image} />
              ))
            ) : (
              <>
                {images.slice(0, LIMIT_IMAGES_TO_SHOW)?.map((image) => (
                  <TagImage key={image.digest} image={image} />
                ))}
                {images.length - LIMIT_IMAGES_TO_SHOW > 0 && (
                  <Typography color="secondary.dark" onClick={handleShowMore}>
                    {`+${images.length - LIMIT_IMAGES_TO_SHOW} more...`}
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
      </div>
    </div>
  )
}

TagImage.displayName = 'TagImage'

TagImage.propTypes = {
  image: PropTypes.shape({
    digest: PropTypes.string,
    os: PropTypes.string,
    architecture: PropTypes.string,
    size: PropTypes.number,
  }),
}

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
}

export default Row
