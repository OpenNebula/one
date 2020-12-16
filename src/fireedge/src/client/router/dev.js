import { Ballot as BallotIcon } from '@material-ui/icons'

import TestApi from 'client/containers/TestApi'
import Webconsole from 'client/containers/Webconsole'

export const PATH = {
  TEST_API: '/test-api',
  WEB_CONSOLE: '/webconsole'
}

export const ENDPOINTS = [
  {
    label: 'Test API',
    path: PATH.TEST_API,
    authenticated: true,
    devMode: true,
    sidebar: true,
    icon: BallotIcon,
    component: TestApi
  },
  {
    label: 'Webconsole',
    path: PATH.WEB_CONSOLE,
    authenticated: true,
    devMode: true,
    sidebar: true,
    icon: BallotIcon,
    component: Webconsole
  }
]
