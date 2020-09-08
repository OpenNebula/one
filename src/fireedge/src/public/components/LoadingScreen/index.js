import React from 'react';

import { styled, Box } from '@material-ui/core';
import Logo from 'client/icons/logo';

const ScreenBox = styled(Box)({
  width: '100%',
  height: '100vh',
  backgroundColor: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'fixed',
  zIndex: 10000
});

const LoadingScreen = () => (
  <ScreenBox>
    <Logo width={360} height={360} spinner withText />
  </ScreenBox>
);

export default LoadingScreen;
