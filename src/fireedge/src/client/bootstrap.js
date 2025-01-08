/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
const LOCAL_REMOTES_COPY = 'localRemotesConfig'
const USING_FALLBACK = 'usingRemotesFallbackConfig'
const FORCE_LOCAL_FALLBACK = 'usingLocalRemotesFallbackConfig'
const HOST_RESOLVE_FLAG = '__HOST__'

const showEditor = ({ failedModule = '', error = '' } = {}) =>
  new Promise((resolve) => {
    const oldContainer = document.getElementById('inline-remotes-config-editor')
    if (oldContainer) {
      oldContainer.remove()
    }
    const remotesConfig = localStorage.getItem(LOCAL_REMOTES_COPY)
    const fallback =
      !!localStorage.getItem(USING_FALLBACK) ||
      !!localStorage.getItem(FORCE_LOCAL_FALLBACK)

    const success = !failedModule && !error

    const editorContainer = document.createElement('div')

    editorContainer.innerHTML = `
      <div id="inline-remotes-config-editor" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #40b3da; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999;">
        <h2 style="color: #2c3e50;">Remote Modules Fallback Editor</h2>
        <h4 style="color: #2c3e50;">
          ${
            fallback && !success
              ? 'Using fallback configuration. However, a module failed to load. Please review the configuration.'
              : fallback
              ? 'Using fallback configuration. The server failed to parse the <mark style="background-color: #0099c3; color: #ffffff;">remotes-config.json</mark> file.'
              : !success
              ? 'You have an error in your remotes configuration file or one of the modules failed to load.'
              : 'Configuration loaded successfully.'
          }
        </h4>
        <div style="background: #212d3d; padding: 20px; border-radius: 5px; width: 100%; height: 100%; margin: 50px; display: flex; flex-direction: column; align-items: center;">
          ${
            !success
              ? failedModule
                ? `<h2>Failed to load: <mark style="background-color: #cc0000;">${failedModule}</mark></h2>`
                : `<h4 style="background-color: #cc0000; color: #000;">Error: ${error}</h4>`
              : `<h2>Configuration Loaded Successfully</h2>`
          }
          <textarea id="config-editor" style="padding: 5px; width: 85%; height: 65%;">${remotesConfig}</textarea>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button id="editor-reset-button" style="width: 100px; height: 40px; background: #e74c3c; border: none; border-radius: 5px; color: #fff; cursor: pointer;">
              Reset 
            </button>
            <button id="editor-clearfallback-button" style="width: 150px; height: 40px; background: #0EADE1; border: none; border-radius: 5px; color: #fff; cursor: pointer;">
             Clear fallback configuration 
            </button>
            <button id="editor-load-button" style="width: 100px; height: 40px; background: #2ecc71; border: none; border-radius: 5px; color: #fff; cursor: pointer;">
              ${success ? 'Continue' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(editorContainer)

    document
      .getElementById('editor-load-button')
      .addEventListener('click', () => {
        try {
          const newConfig = JSON.parse(
            document.getElementById('config-editor').value
          )

          localStorage.setItem(
            LOCAL_REMOTES_COPY,
            JSON.stringify(newConfig, null, 2)
          )

          editorContainer.remove()
          resolve()
        } catch {
          alert('Invalid JSON. Fix and try again.')
        }
      })

    document
      .getElementById('editor-clearfallback-button')
      .addEventListener('click', () => {
        try {
          document.getElementById('config-editor').value = JSON.stringify(
            window.__REMOTES_MODULE_CONFIG__,
            null,
            2
          )
          localStorage.removeItem(USING_FALLBACK)
          localStorage.removeItem(FORCE_LOCAL_FALLBACK)
          editorContainer.remove()
          resolve()
        } catch {
          alert('Failed to set editor config')
        }
      })

    document
      .getElementById('editor-reset-button')
      .addEventListener('click', () => {
        try {
          const defaultRemoteModules = [
            'UtilsModule',
            'ConstantsModule',
            'ContainersModule',
            'ComponentsModule',
            'FeaturesModule',
            'ProvidersModule',
            'ModelsModule',
            'HooksModule',
          ]

          const fallbackConfig = Object.fromEntries(
            defaultRemoteModules.map((module) => [
              module,
              {
                name: module,
                entry: `${HOST_RESOLVE_FLAG}/fireedge/modules/${module}/remoteEntry.js`,
              },
            ])
          )
          document.getElementById('config-editor').value = JSON.stringify(
            resolveHostFlag(fallbackConfig),
            null,
            2
          )
        } catch {
          alert('Failed to reset editor config')
        }
      })
  })

const editFallbackConfig = async () => {
  const usingServerFallback = !!localStorage.getItem(USING_FALLBACK)
  const usingLocalFallback = !!localStorage.getItem(FORCE_LOCAL_FALLBACK)
  if (usingServerFallback || usingLocalFallback) {
    const userWantsToEdit = !window.confirm(
      'Using fallback. Click "OK" to continue or "Cancel" to edit.'
    )

    if (userWantsToEdit) {
      await showEditor()
      await bootstrap(true)
    }
  }
}

const isInitialized = (obj) => !!Object.keys(obj || {}).length

const resolveHostFlag = (config) =>
  Object.entries(config).reduce((acc, [id, meta]) => {
    if (meta?.entry?.includes(HOST_RESOLVE_FLAG)) {
      acc[id] = {
        ...meta,
        entry: meta.entry.replace(HOST_RESOLVE_FLAG, window.location.origin),
      }
    } else {
      acc[id] = meta
    }

    return acc
  }, {})

const initLocalRemotesConfig = async (forceNoDialog = false) => {
  // Server provided config
  const { fallback = false, ...serverRemotesConfig } =
    window.__REMOTES_MODULE_CONFIG__

  const remotesConfig = resolveHostFlag(serverRemotesConfig)

  const useLocalFallback = !!localStorage.getItem(FORCE_LOCAL_FALLBACK)

  const syncLocalCopy = () => {
    localStorage.setItem(
      LOCAL_REMOTES_COPY,
      JSON.stringify(remotesConfig, null, 2)
    )
  }

  const localCopyConfig = JSON.parse(localStorage.getItem(LOCAL_REMOTES_COPY))

  if (!isInitialized(localCopyConfig) || (!fallback && !useLocalFallback)) {
    syncLocalCopy()
  }

  if (!forceNoDialog && (fallback || useLocalFallback)) {
    await editFallbackConfig()
  }

  fallback
    ? localStorage.setItem(USING_FALLBACK, true)
    : localStorage.removeItem(USING_FALLBACK)
}

const testLoadModule = async (scriptUrl, moduleId) =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script')

    script.type = 'text/javascript'

    script.src = scriptUrl
    script.async = true

    script.onload = () => {
      resolve()
    }

    script.onerror = () => {
      reject(new Error(`Failed to load script: ${scriptUrl}`))
    }

    document.head.appendChild(script)
  })

const checkRemotes = async () => {
  const failedModules = []
  const remotesConfig = JSON.parse(localStorage.getItem(LOCAL_REMOTES_COPY))

  const loadPromises = Object.entries(remotesConfig).map(
    async ([id, module]) => {
      const isValid = module?.name && module?.entry
      if (!isValid) {
        throw new Error(
          `Module: ${id} contains invalid configuration. Ensure 'name' and 'entry' are defined: ${JSON.stringify(
            module,
            null,
            2
          )}`
        )
      }

      try {
        await testLoadModule(module.entry, id)
      } catch (error) {
        console.warn(`Module failed to load: ${id}`, error)
        failedModules.push(id)
      }
    }
  )

  await Promise.all(loadPromises)

  if (failedModules.length) {
    throw new Error(
      `The following modules failed to load: ${failedModules.join(', ')}`
    )
  }

  return true
}
const loadClient = async () => {
  // eslint-disable-next-line no-undef
  await __webpack_init_sharing__('default')

  const { default: initApp } = await import('client/sunstone')
  initApp()
}

const syncConfig = async () => {
  window.__REMOTES_MODULE_CONFIG__ = await JSON.parse(
    localStorage.getItem(LOCAL_REMOTES_COPY)
  )
}

async function bootstrap(forceNoDialog = false) {
  try {
    await initLocalRemotesConfig(forceNoDialog)
    await checkRemotes()
    await syncConfig()
    loadClient()
  } catch (error) {
    const failedModule = error?.message.match(/modules\/([^/]+)/)?.[1] || ''
    console.error('Failed to load module: ', failedModule || error)

    localStorage.setItem(FORCE_LOCAL_FALLBACK, true)
    await showEditor({
      failedModule: failedModule,
      error: error?.message ?? error,
    })

    await bootstrap(true)
  }
}

bootstrap()
