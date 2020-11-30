import React from 'react'
import PropTypes from 'prop-types'

import { Box } from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import { Tr } from 'client/components/HOC'

const AlertError = ({ children, ...props }) => (
  <Box pt={3} display="flex" justifyContent="center" {...props}>
    <Alert severity="error" icon={false} variant="filled">
      {typeof children === 'string' ? Tr(children) : children}
    </Alert>
  </Box>
)

AlertError.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

AlertError.defaultProps = {
  children: 'Error!'
}

export default AlertError
