import * as React from 'react'

import { Box } from '@material-ui/core'
import Logo from 'client/icons/logo'

const LoadingScreen = () => (
  <Box
    style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      zIndex: 10000
    }}
  >
    <Logo width={360} height={360} spinner withText />
  </Box>
)

export default LoadingScreen
