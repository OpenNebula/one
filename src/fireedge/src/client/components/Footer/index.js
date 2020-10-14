import React, { memo } from 'react'

import { Box, Link, Typography } from '@material-ui/core'

import footerStyles from 'client/components/Footer/styles'
import { by } from 'client/constants'

const { text, url } = by

const Footer = memo(() => {
  const classes = footerStyles()

  return (
    <Box className={classes.footer} component="footer">
      <Typography variant="body2">
        {'Made with'}
        <span className={classes.heartIcon} role="img" aria-label="heart-emoji">
          {'❤️'}
        </span>
        {'by'}
        <Link href={url} className={classes.link}>
          {text}
        </Link>
      </Typography>
    </Box>
  )
})

Footer.displayName = 'Footer'

export default Footer
