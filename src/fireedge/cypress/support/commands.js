const { internalLog } = require('./utils')
const { sep } = require('path')

Cypress.Commands.add('login', () => {
  cy.fixture('defaults').then(defaults => {
    cy.get('[data-cy=login-user]').clear().type(defaults.auth.username)
    cy.get('[data-cy=login-token]').clear().type(defaults.auth.password)
  })
  cy.get('[data-cy=login-button]').then(($btn) => {
    cy.wrap($btn).click()
  })
})

Cypress.Commands.add('openUserModal', (callback = () => undefined) => {
  cy.get('[data-cy=header-user-button]').then(($btn) => {
    if ($btn) {
      cy.wrap($btn).click({ force: true })
    }
    callback()
  })
})

Cypress.Commands.add('logout', () => {
  cy.openUserModal(
    () => {
      cy.get('[data-cy=header-logout-button]').then(($btn) => {
        if ($btn) {
          cy.wrap($btn).click({ force: true })
          cy.fixture('defaults').then(defaults => {
            cy.window().its('sessionStorage').invoke('removeItem', defaults.auth.jwtName)
          })
        }
      })
    }
  )
})

Cypress.Commands.add('getJWT', (callback = () => undefined) => {
  cy.fixture('defaults').then(defaults => {
    cy.window().then(win => {
      callback(win.sessionStorage.getItem(defaults.auth.jwtName))
    })
  })
})

Cypress.Commands.add('navigateMenu', (contentText = '', callback = () => undefined) => {
  if (contentText) {
    let rtn = true
    cy.get('[data-cy=main-menu]').find('li').each($li => {
      if ($li && $li.text && typeof $li.text === 'function' && $li.text().toLowerCase() === contentText.toLowerCase()) {
        rtn = false
        cy.wrap($li).click({ force: true }).then(() => {
          callback()
        })
      }
      return rtn
    })
  }
})

Cypress.Commands.add('goToIndex', (path = '', callback = () => undefined) => {
  if (expect(path).to.not.be.empty) {
    const folders = path.split(sep)
    cy.fixture('defaults').then(defaults => {
      if (expect(defaults.apps).to.be.a('object')) {
        const apps = Object.keys(defaults.apps)
        let selectApp = ''
        apps.forEach(app => {
          if (folders.includes(app)) {
            selectApp = app
          }
        })
        if (expect(apps).to.be.a('array') && expect(apps).to.include(selectApp)) {
          cy.visit(`/${selectApp}`, { timeout: 30000 })
          cy.getJWT((JWT) => {
            if (!JWT) {
              cy.get('[data-cy=opennebula-logo]').then($window => {
                if ($window) {
                  cy.wait(1500)
                }
              })
            }
            callback()
          })
        }
      }
    })
  }
})
