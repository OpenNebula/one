define(['hbs!'+require.toUrl('tests/templates/sexpr_hash')], function(template) {

  describe("Subexpression handled in helpers", function() {

    it("can render subexpressions in helpers", function() {
      expect(typeof template).to.equal('function');
      var html = template({hello: 'world'});
      var container = document.createElement('div');
      container.innerHTML=html;
      var text = container.innerText.trim();
      expect(text).to.equal('Testing sexpr in helper hash Foo (Bar) Baz');
    });

  });

});
