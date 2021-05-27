import loadable from '@loadable/component'

const Login = loadable(() => import('client/containers/Login'), { ssr: false })

export const PATH = {
  LOGIN: '/'
}

export const ENDPOINTS = [
  {
    label: 'Login',
    path: PATH.LOGIN,
    Component: Login
  }
]

export default { PATH, ENDPOINTS }
