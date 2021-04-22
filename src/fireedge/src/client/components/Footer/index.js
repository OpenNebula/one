import React, { memo } from 'react'

import { Box, Link, Typography } from '@material-ui/core'

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
