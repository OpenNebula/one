import React from 'react'
import { Typography, Link } from '@material-ui/core'

const Copyright = () => {
  const year = new Date().getFullYear()

  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://opennebula.io/">
        OpenNebula.io
      </Link>
      {` ${year}. `}
    </Typography>
  )
}

export default Copyright
