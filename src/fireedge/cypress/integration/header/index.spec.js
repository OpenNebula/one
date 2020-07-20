// / <reference types="Cypress" />

context('Header', () => {
  before(() => {
    cy.visit('/');
    cy.login();
  });

  after(() => {
    cy.logout();
  });

  it('has username on header', () => {
    cy.get('[data-cy=header-user-button]').click();

    cy.fixture('defaults').then(defaults => {
      cy.get('[data-cy=header-username]').should(
        'have.text',
        defaults.auth.username
      );
    });
  });
});
