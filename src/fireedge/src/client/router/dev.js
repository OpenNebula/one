import { Ballot as BallotIcon, Computer as VmIcon } from '@material-ui/icons'
import loadable from '@loadable/component'

const TestApi = loadable(() => import('client/containers/TestApi'), { ssr: false })
const WebConsole = loadable(() => import('client/containers/WebConsole'), { ssr: false })

export const PATH = {
  VIRTUAL_MACHINES: '/vms',
  TEST_API: '/test-api',
  WEB_CONSOLE: '/webconsole'
}

export const ENDPOINTS = [
  {
    label: 'Test API',
    path: PATH.TEST_API,
    devMode: true,
    sidebar: true,
    icon: BallotIcon,
    Component: TestApi
  },
  {
    label: 'Web Console',
    path: PATH.WEB_CONSOLE,
    devMode: true,
    sidebar: true,
    icon: BallotIcon,
    Component: WebConsole
  }
]

export default { PATH, ENDPOINTS }
