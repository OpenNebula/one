require 'test_helper'

class ParseResponseTest < Test::Unit::TestCase
  def check desc, str, expected
    soap = VIM.new(:ns => 'urn:vim25', :rev => '4.0')
    got = soap.parse_response Nokogiri(str).root, desc
    assert_equal expected, got
  end

  def test_string_array
    desc = { 'wsdl_type' => 'xsd:string', 'is-array' => true, 'is-task' => false }

    check desc, <<-EOS, ['a', 'b', 'c']
<root xmlns="urn:vim25">
  <blah>a</blah>
  <blah>b</blah>
  <blah>c</blah>
</root>
    EOS
  end

  def test_missing_parameter_fault
    desc = { 'wsdl_type' => nil, 'is-array' => false, 'is-task' => false }

    assert_raise RuntimeError do
      check desc, <<-EOS, ['a', 'b', 'c']
<soapenv:Fault xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <faultcode>ClientFaultCode</faultcode>
  <faultstring>Required parameter selectionSet is missing</faultstring>
</soapenv:Fault>
      EOS
    end
  end

  def test_invalid_argument_fault
    desc = { 'wsdl_type' => nil, 'is-array' => false, 'is-task' => false }

    assert_raise RbVmomi::Fault do
      begin
        check desc, <<-EOS, nil
<soapenv:Fault xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <faultcode>ServerFaultCode</faultcode>
  <faultstring>A specified parameter was not correct. ticketType</faultstring>
  <detail>
    <InvalidArgumentFault xmlns="urn:vim25" xsi:type="InvalidArgument">
      <invalidProperty>ticketType</invalidProperty>
    </InvalidArgumentFault>
  </detail>
</soapenv:Fault>
        EOS
      rescue VIM::InvalidArgument
        raise
      rescue
        raise "wrong fault"
      end
    end
  end

  def test_task_array_result
    desc = { 'wsdl_type' => 'xsd:string', 'is-array' => true, 'is-task' => true }

    check desc, <<-EOS, VIM.Task(nil, 'haTask-ha-host-vim.DiagnosticManager.generateLogBundles-865')
<root xmlns="urn:vim25">
  <returnval type="Task">haTask-ha-host-vim.DiagnosticManager.generateLogBundles-865</returnval>
</root>
    EOS
  end
end

