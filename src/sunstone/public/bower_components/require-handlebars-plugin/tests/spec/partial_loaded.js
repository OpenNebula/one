define([], function() {

  require(['hbs!tests/templates/_partial_loaded'], function(partial) {

    describe("Require reference to a partial", function() {

      expect(partial).to.exist;
    });
  });

  require(['hbs!tests/templates/partial_loaded'], function(template) {
    describe("template with an already loaded partial", function() {

      it("loads the partials", function() {

        var html = template({partialValue: "ha"});
        var container = document.createElement('div');
        container.innerHTML = html;
        var bs = container.getElementsByTagName('b');
        expect(bs).to.exist;
        expect(bs.length).to.equal(1);
        expect(bs[0].innerText).to.equal('Referenced ha');

      });

    });
  });
});
