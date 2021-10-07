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
import { memo } from 'react'

import { Box, Link, Typography } from '@mui/material'

import footerStyles from 'client/components/Footer/styles'
import { BY } from 'client/constants'

const Footer = memo(() => {
  const classes = footerStyles()

  return (
    <Box className={classes.footer} component="footer">
      <Typography variant="body2">
        {'Made with'}
        <span className={classes.heartIcon} role="img" aria-label="heart-emoji">
          {'❤️'}
        </span>
        <Link href={BY.url} className={classes.link}>
          {BY.text}
        </Link>
      </Typography>
    </Box>
  )
})

Footer.displayName = 'Footer'

export default Footer
