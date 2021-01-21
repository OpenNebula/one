const { createIntercept, waitIntercept } = require('../../../support/utils')
const testType = 'Provider'

const reloadProviderComponent = () => {
  // for reload the provider react-component this update the provider list
  cy.navigateMenu('dashboard')
}

const interceptList = {
  method: 'GET',
  url: '/provider/list'
}
const interceptCreate = {
  method: 'POST',
  url: '/provider/create'
}
const interceptConfigure = {
  method: 'PUT',
  url: '/provider/update'
}
const interceptDelete = {
  method: 'DELETE',
  url: '/provider/delete'
}

let defaultSettings = {}

context(testType, () => {
  before(() => {
    // fill settings
    cy.fixture('defaults').then(defaults => {
      defaultSettings = defaults.provision
    })

    // go to index app
    cy.visit('/')
    cy.login()
  })

  after(() => {
    cy.logout()
  })

  it('Create a Provider', () => {
    cy.navigateMenu(`${testType}s`, () => {
      cy.get('[data-cy=create-provider]').click({ force: true }).then(() => {
        waitIntercept(createIntercept(interceptList), () => {
          cy.get('[data-cy=select-provision-type]').select(defaultSettings.provision || '')
          cy.get('[data-cy=select-provider-type]').select(defaultSettings.provider || '')
          let brk = true

          // expect test
          const validateTest = request => {
            expect(request).to.be.a('object')
            expect(request).to.nested.include({ 'response.body.id': 200 })
          }

          // fill form "Configure Connection" tab
          const fillFormConfigureConnection = () => {
            cy.get('[data-cy=stepper-next-button]').then($button => {
              cy.get('[data-cy=form-provider-access_key]').clear().type(defaultSettings.key || '')
              cy.get('[data-cy=form-provider-secret_key]').clear().type(defaultSettings.secretKey || '')
              const intercept = createIntercept(interceptCreate)
              cy.wrap($button).click({ force: true })
              waitIntercept(intercept, validateTest)
            })
          }

          // fill form "Provider Overview" tab
          const fillFormProviderOverview = () => {
            cy.get('[data-cy=stepper-next-button]').then($button => {
              cy.get('[data-cy=form-provider-name]').clear().type(defaultSettings.nameProvider || '')
              cy.get('[data-cy=form-provider-description]').clear().type(defaultSettings.descriptionProvider || '')
              cy.wrap($button).click({ force: true })
              fillFormConfigureConnection()
            })
          }

          // select template in "Provider template" tab
          const selectTemplate = $el => {
            brk = false
            cy.wrap($el).find('>button').click({ force: true }).then(() => {
              cy.get('[data-cy=stepper-next-button]').then($button => {
                cy.wrap($button).click({ force: true })
                fillFormProviderOverview()
              })
            })
          }

          // find provider template in "Provider template" tab
          cy.get('[data-cy=providers-templates]').find('[data-cy=provider-template-card]').each($el => {
            if (defaultSettings && defaultSettings.nameProvider && $el.find('[data-cy=provider-template-card-title]').text() === defaultSettings.nameProvider) {
              selectTemplate($el)
            }
            return brk
          })
        })
      })
    })
  })

  it('Check information a Provider', () => {
    reloadProviderComponent()
    cy.navigateMenu(`${testType}s`, () => {
      waitIntercept(createIntercept(interceptList), () => {
        let brk = true

        // select provider
        const selectProvider = $el => {
          brk = false
          cy.wrap($el).find('>button').click({ force: true }).then(() => {
            waitIntercept(createIntercept(interceptList), info => {
              cy.get('[data-cy=provider-name]').should('have.text', defaultSettings.nameProvider)
              cy.get('[data-cy=provider-description]').should('have.text', defaultSettings.descriptionProvider)
              cy.get('[data-cy=provider-type]').should('have.text', defaultSettings.provider)
              cy.get('[data-cy=provider-access_key]').should('have.text', defaultSettings.key)
              cy.get('[data-cy=provider-secret_key]').should('have.text', defaultSettings.secretKey)
              cy.get('[data-cy=dg-cancel-button]').click({ force: true })
            })
          })
        }

        // find provider
        cy.get('[data-cy=providers]').find('[data-cy=provider-card]').each($el => {
          if (defaultSettings && defaultSettings.nameProvider && $el.find('[data-cy=provider-card-title]').text() === defaultSettings.nameProvider) {
            selectProvider($el)
          }
          return brk
        })
      })
    })
  })

  it('Configure', () => {
    reloadProviderComponent()
    cy.navigateMenu(`${testType}s`, () => {
      waitIntercept(createIntercept(interceptList), () => {
        let brk = true

        // expect test
        const validateTest = request => {
          expect(request).to.be.a('object')
          expect(request).to.nested.include({ 'response.body.id': 200 })
        }

        // fill "Configure connection" tab
        const fillConfigureConnection = $button => {
          const intercept = createIntercept(interceptConfigure)
          cy.get('[data-cy=form-provider-access_key]').clear().type(defaultSettings.keyEdited || '')
          cy.get('[data-cy=form-provider-secret_key]').clear().type(defaultSettings.secretKeyEdited || '')
          cy.wrap($button).click({ force: true })
          waitIntercept(intercept, validateTest)
        }

        // fill "Provider overview" tab
        const fillProviderOverview = $button => {
          cy.get('[data-cy=form-provider-description]').clear().type(defaultSettings.descriptionProviderEdited || '')
          cy.wrap($button).click({ force: true })
          cy.get('[data-cy=stepper-next-button]').then(fillConfigureConnection)
        }

        // select provider
        const selectProvider = $el => {
          brk = false
          cy.wrap($el).find('[data-cy=provider-edit]').click({ force: true }).then(() => {
            waitIntercept(createIntercept(interceptList), () => {
              cy.get('[data-cy=stepper-next-button]').then(fillProviderOverview)
            })
          })
        }

        // find provider
        cy.get('[data-cy=providers]').find('[data-cy=provider-card]').each($el => {
          if (defaultSettings && defaultSettings.nameProvider && $el.find('[data-cy=provider-card-title]').text() === defaultSettings.nameProvider) {
            selectProvider($el)
          }
          return brk
        })
      })
    })
  })

  it('Delete', () => {
    reloadProviderComponent()
    cy.navigateMenu(`${testType}s`, () => {
      waitIntercept(createIntercept(interceptList), () => {
        let brk = true

        // expect test
        const validateTest = request => {
          expect(request).to.be.a('object')
          expect(request).to.nested.include({ 'response.body.id': 202 })
        }

        // select provider
        const selectProvider = $el => {
          brk = false
          cy.wrap($el).find('[data-cy=provider-delete]').click({ force: true }).then(() => {
            waitIntercept(createIntercept(interceptList), () => {
              const intercept = createIntercept(interceptDelete)
              cy.get('[data-cy=dg-accept-button]').click({ force: true }).then(() => {
                waitIntercept(intercept, validateTest)
              })
            })
          })
        }

        // find provider
        cy.get('[data-cy=providers]').find('[data-cy=provider-card]').each($el => {
          if (defaultSettings && defaultSettings.nameProvider && $el.find('[data-cy=provider-card-title]').text() === defaultSettings.nameProvider) {
            selectProvider($el)
          }
          return brk
        })
      })
    })
  })
})
