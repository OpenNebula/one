require 'test_helper'

class EmitRequestTest < Test::Unit::TestCase
  MO = VIM::VirtualMachine(nil, "foo")

  def check desc, str, this, params
    soap = VIM.new(:ns => 'urn:vim25', :rev => '4.0')
    xml = Builder::XmlMarkup.new :indent => 2
    soap.emit_request xml, 'root', desc, this, params

    begin
      assert_equal str, xml.target!
    rescue MiniTest::Assertion
      puts "expected:"
      puts str
      puts
      puts "got:"
      puts xml.target!
      puts
      raise
    end
  end

  def test_string_array
    desc = [
      {
        'name' => 'blah',
        'is-array' => true,
        'is-optional' => true,
        'wsdl_type' => 'xsd:string',
      }
    ]

    check desc, <<-EOS, MO, :blah => ['a', 'b', 'c']
<root xmlns="urn:vim25">
  <_this type="VirtualMachine">foo</_this>
  <blah>a</blah>
  <blah>b</blah>
  <blah>c</blah>
</root>
    EOS
  end

  def test_required_param
    desc = [
      {
        'name' => 'blah',
        'is-array' => false,
        'is-optional' => false,
        'wsdl_type' => 'xsd:string',
      }
    ]

    check desc, <<-EOS, MO, :blah => 'a'
<root xmlns="urn:vim25">
  <_this type="VirtualMachine">foo</_this>
  <blah>a</blah>
</root>
    EOS

    assert_raise RuntimeError do
      check desc, <<-EOS, MO, {}
<root xmlns="urn:vim25">
  <_this type="VirtualMachine">foo</_this>
</root>
      EOS
    end
  end

  def test_optional_param
    desc = [
      {
        'name' => 'blah',
        'is-array' => false,
        'is-optional' => true,
        'wsdl_type' => 'xsd:string',
      }
    ]

    check desc, <<-EOS, MO, {}
<root xmlns="urn:vim25">
  <_this type="VirtualMachine">foo</_this>
</root>
    EOS
  end

  def test_nil_optional_param
    desc = [
      {
        'name' => 'blah',
        'is-array' => false,
        'is-optional' => true,
        'wsdl_type' => 'xsd:string',
      }
    ]

    check desc, <<-EOS, MO, :blah => nil
<root xmlns="urn:vim25">
  <_this type="VirtualMachine">foo</_this>
</root>
    EOS
  end

  def test_string_key
    desc = [
      {
        'name' => 'blah',
        'is-array' => false,
        'is-optional' => false,
        'wsdl_type' => 'xsd:string',
      }
    ]

    check desc, <<-EOS, MO, 'blah' => 'a'
<root xmlns="urn:vim25">
  <_this type="VirtualMachine">foo</_this>
  <blah>a</blah>
</root>
    EOS
  end

  def disabled_test_required_property
    assert_raise RuntimeError do
      VIM::AboutInfo()
    end
  end
end

