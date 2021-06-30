import loadable from '@loadable/component'
import { Code as DevIcon } from 'iconoir-react'

const TestApi = loadable(() => import('client/containers/TestApi'), { ssr: false })

export const PATH = {
  TEST_API: '/test-api'
}

export const ENDPOINTS = [
  {
    label: 'Test API',
    path: PATH.TEST_API,
    devMode: true,
    sidebar: true,
    icon: DevIcon,
    Component: TestApi
  }
]

export default { PATH, ENDPOINTS }
