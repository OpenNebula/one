const MODE = {
  development: 'development',
  production: 'production'
}

const isBackend = () => typeof window === 'undefined'

const isProduction = () => process.env.NODE_ENV === 'production'

const isDevelopment = () => process.env.NODE_ENV === 'development'

export default MODE[process.env.NODE_ENV]

export { isProduction, isDevelopment, isBackend }
