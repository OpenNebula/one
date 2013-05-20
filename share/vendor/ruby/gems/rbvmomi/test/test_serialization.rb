require 'test_helper'

class SerializationTest < Test::Unit::TestCase
  def check str, obj, type, array=false
    conn = VIM.new(:ns => 'urn:vim25', :rev => '4.0')
    xml = Builder::XmlMarkup.new :indent => 2
    conn.obj2xml(xml, 'root', type, array, obj)

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

  def test_moref
    check <<-EOS, VIM.Folder(nil, "ha-folder-host"), "Folder"
<root type="Folder">ha-folder-host</root>
    EOS
  end

  def test_config
    cfg = VIM.VirtualMachineConfigSpec(
      :name => 'vm',
      :files => { :vmPathName => '[datastore1]' },
      :guestId => 'otherGuest64',
      :numCPUs => 2,
      :memoryMB => 3072,
      :deviceChange => [
        {
          :operation => :add,
          :device => VIM.VirtualLsiLogicController(
            :key => 1000,
            :busNumber => 0,
            :sharedBus => :noSharing
          )
        }, VIM.VirtualDeviceConfigSpec(
          :operation => VIM.VirtualDeviceConfigSpecOperation(:add),
          :fileOperation => VIM.VirtualDeviceConfigSpecFileOperation(:create),
          :device => VIM.VirtualDisk(
            :key => 0,
            :backing => VIM.VirtualDiskFlatVer2BackingInfo(
              :fileName => '[datastore1]',
              :diskMode => :persistent,
              :thinProvisioned => true
            ),
            :controllerKey => 1000,
            :unitNumber => 0,
            :capacityInKB => 4000000
          )
        ), {
          :operation => :add,
          :device => VIM.VirtualE1000(
            :key => 0,
            :deviceInfo => {
              :label => 'Network Adapter 1',
              :summary => 'VM Network'
            },
            :backing => VIM.VirtualEthernetCardNetworkBackingInfo(
              :deviceName => 'VM Network'
            ),
            :addressType => 'generated'
          )
        }
      ],
      :extraConfig => [
        {
          :key => 'bios.bootOrder',
          :value => 'ethernet0'
        }
      ]
    )
    check <<-EOS, cfg, "VirtualMachineConfigSpec"
<root xsi:type="VirtualMachineConfigSpec">
  <name>vm</name>
  <guestId>otherGuest64</guestId>
  <files xsi:type="VirtualMachineFileInfo">
    <vmPathName>[datastore1]</vmPathName>
  </files>
  <numCPUs>2</numCPUs>
  <memoryMB>3072</memoryMB>
  <deviceChange xsi:type="VirtualDeviceConfigSpec">
    <operation>add</operation>
    <device xsi:type="VirtualLsiLogicController">
      <key>1000</key>
      <busNumber>0</busNumber>
      <sharedBus>noSharing</sharedBus>
    </device>
  </deviceChange>
  <deviceChange xsi:type="VirtualDeviceConfigSpec">
    <operation>add</operation>
    <fileOperation>create</fileOperation>
    <device xsi:type="VirtualDisk">
      <key>0</key>
      <backing xsi:type="VirtualDiskFlatVer2BackingInfo">
        <fileName>[datastore1]</fileName>
        <diskMode>persistent</diskMode>
        <thinProvisioned>1</thinProvisioned>
      </backing>
      <controllerKey>1000</controllerKey>
      <unitNumber>0</unitNumber>
      <capacityInKB>4000000</capacityInKB>
    </device>
  </deviceChange>
  <deviceChange xsi:type="VirtualDeviceConfigSpec">
    <operation>add</operation>
    <device xsi:type="VirtualE1000">
      <key>0</key>
      <deviceInfo xsi:type="Description">
        <label>Network Adapter 1</label>
        <summary>VM Network</summary>
      </deviceInfo>
      <backing xsi:type="VirtualEthernetCardNetworkBackingInfo">
        <deviceName>VM Network</deviceName>
      </backing>
      <addressType>generated</addressType>
    </device>
  </deviceChange>
  <extraConfig xsi:type="OptionValue">
    <key>bios.bootOrder</key>
    <value xsi:type="xsd:string">ethernet0</value>
  </extraConfig>
</root>
    EOS
  end

  def test_nil_field
    obj = VIM.OptionValue(:key => 'foo', :value => nil)
    check <<-EOS, obj, "OptionValue"
<root xsi:type="OptionValue">
  <key>foo</key>
</root>
    EOS
  end

  def test_string_array
    obj = ["foo", "bar", "baz"]
    check <<-EOS, obj, "xsd:string", true
<root>foo</root>
<root>bar</root>
<root>baz</root>
    EOS
  end

  def test_int_array
    obj = [1,2,3]
    check <<-EOS, obj, "xsd:int", true
<root>1</root>
<root>2</root>
<root>3</root>
    EOS
  end

  def test_boolean_array
    obj = [true,false,true]
    check <<-EOS, obj, "xsd:boolean", true
<root>1</root>
<root>0</root>
<root>1</root>
    EOS
  end

  def test_float_array
    obj = [0.0,1.5,3.14]
    check <<-EOS, obj, "xsd:float", true
<root>0.0</root>
<root>1.5</root>
<root>3.14</root>
    EOS
  end

  def test_binary
    obj = "\x00foo\x01bar\x02baz"
    check <<-EOS, obj, 'xsd:base64Binary'
<root>AGZvbwFiYXICYmF6</root>
    EOS
  end

  def test_property_spec
    interested = %w(info.progress info.state info.entityName info.error)
    tasks = [VIM::Task.new(nil, 'task-11')]
    obj = {
      :propSet => [{ :type => 'Task', :all => false, :pathSet => interested }],
      :objectSet => tasks.map { |x| { :obj => x } },
    }
    check <<-EOS, obj, 'PropertyFilterSpec'
<root xsi:type="PropertyFilterSpec">
  <propSet xsi:type="PropertySpec">
    <type>Task</type>
    <all>0</all>
    <pathSet>info.progress</pathSet>
    <pathSet>info.state</pathSet>
    <pathSet>info.entityName</pathSet>
    <pathSet>info.error</pathSet>
  </propSet>
  <objectSet xsi:type="ObjectSpec">
    <obj type="Task">task-11</obj>
  </objectSet>
</root>
    EOS

  end

  def test_keyvalue
    obj = RbVmomi::BasicTypes::KeyValue.new('a', 'b')
    check <<-EOS, obj, 'KeyValue', false
<root>
  <key>a</key>
  <value>b</value>
</root>
    EOS

    obj = ['a', 'b']
    check <<-EOS, obj, 'KeyValue', false
<root>
  <key>a</key>
  <value>b</value>
</root>
    EOS

    obj = [['a', 'b'], ['c', 'd']]
    check <<-EOS, obj, 'KeyValue', true
<root>
  <key>a</key>
  <value>b</value>
</root>
<root>
  <key>c</key>
  <value>d</value>
</root>
    EOS

    obj = { 'a' => 'b', :c => 'd' }
    check <<-EOS, obj, 'KeyValue', true
<root>
  <key>a</key>
  <value>b</value>
</root>
<root>
  <key>c</key>
  <value>d</value>
</root>
    EOS
  end

  def test_ovf_import_spec_params
    obj = RbVmomi::VIM::OvfCreateImportSpecParams(
      :hostSystem => VIM::HostSystem(nil, "myhost"),
      :locale => "US",
      :entityName => "myvm",
      :deploymentOption => "",
      :networkMapping => [],
      :propertyMapping => [['a', 'b'], ['c', 'd']],
      :diskProvisioning => :thin
    )

    check <<-EOS, obj, 'OvfCreateImportSpecParams', false
<root xsi:type="OvfCreateImportSpecParams">
  <locale>US</locale>
  <deploymentOption></deploymentOption>
  <entityName>myvm</entityName>
  <hostSystem type="HostSystem">myhost</hostSystem>
  <propertyMapping>
    <key>a</key>
    <value>b</value>
  </propertyMapping>
  <propertyMapping>
    <key>c</key>
    <value>d</value>
  </propertyMapping>
  <diskProvisioning>thin</diskProvisioning>
</root>
    EOS
  end

  def test_datetime
    obj = DateTime.new(2011, 11, 16, 13, 36, 8, Rational(-8,24))
    check <<-EOS, obj, 'xsd:dateTime', false
<root>2011-11-16T13:36:08-08:00</root>
    EOS
  end

  def test_time
    obj = Time.at DateTime.new(2011, 11, 16, 13, 36, 8, Rational(-8,24)).strftime("%s").to_i
    check <<-EOS, obj, 'xsd:dateTime', false
<root>2011-11-16T13:36:08-08:00</root>
    EOS
  end

  # TODO test all types
  def test_any_type
    obj = 1
    check <<-EOS, obj, 'xsd:anyType', false
<root xsi:type="xsd:long">1</root>
    EOS

    obj = VIM::HostAccountSpec(:id => 'root', :password => 'foo')
    check <<-EOS, obj, 'xsd:anyType', false
<root xsi:type="HostAccountSpec">
  <id>root</id>
  <password>foo</password>
</root>
    EOS
  end
end
