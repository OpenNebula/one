require 'test_helper'

class DeserializationTest < Test::Unit::TestCase
  def setup
    conn = VIM.new(:ns => 'urn:vim25', :rev => '4.0')
    @deserializer = RbVmomi::Deserializer.new conn
  end

  def check str, expected, type
    got = @deserializer.deserialize Nokogiri(str).root, type
    assert_equal expected, got
  end

  def test_moref
    check <<-EOS, VIM.Folder(nil, 'ha-folder-root'), 'Folder'
<root type="Folder">ha-folder-root</root>
    EOS

    check <<-EOS, VIM.Datacenter(nil, 'ha-datacenter'), 'ManagedObjectReference'
<ManagedObjectReference type="Datacenter" xsi:type="ManagedObjectReference">ha-datacenter</ManagedObjectReference>
    EOS
  end

  def test_dataobject
    obj = VIM.DatastoreSummary(
      :capacity => 1000,
      :accessible => true,
      :datastore => VIM.Datastore(nil, "foo"),
      :freeSpace => 31,
      :multipleHostAccess => false,
      :name => "baz",
      :type => "VMFS",
      :url => "http://foo/",
      :dynamicProperty => []
    )

    check <<-EOS, obj, 'DatastoreSummary'
<root>
  <datastore type="Datastore">foo</datastore>
  <name>baz</name>
  <url>http://foo/</url>
  <capacity>1000</capacity>
  <freeSpace>31</freeSpace>
  <accessible>1</accessible>
  <multipleHostAccess>false</multipleHostAccess>
  <type>VMFS</type>
</root>
    EOS
  end

  def test_enum
    check <<-EOS, 'add', 'ConfigSpecOperation'
<root>add</root>
    EOS
  end

  def test_array
    obj = VIM.ObjectContent(
      :obj => VIM.Folder(nil, 'ha-folder-root'),
      :dynamicProperty => [],
      :missingSet => [],
      :propSet => [
        VIM.DynamicProperty(
          :name => 'childEntity',
          :val => [
            VIM.Datacenter(nil, 'ha-datacenter')
          ]
        )
      ]
    )

    check <<-EOS, obj, 'ObjectContent'
<root xmlns:xsi="#{VIM::NS_XSI}">
   <obj type="Folder">ha-folder-root</obj>
   <propSet>
      <name>childEntity</name>
      <val xsi:type="ArrayOfManagedObjectReference">
         <ManagedObjectReference type="Datacenter" xsi:type="ManagedObjectReference">ha-datacenter</ManagedObjectReference>
      </val>
   </propSet>
</root>
    EOS
  end

def test_array2
  obj = VIM.DVPortStatus(
    :dynamicProperty => [],
    :linkUp => true,
    :blocked => false,
    :vlanIds => [
      VIM::NumericRange(:dynamicProperty => [], :start => 5, :end => 7),
      VIM::NumericRange(:dynamicProperty => [], :start => 10, :end => 20),
    ],
    :vmDirectPathGen2InactiveReasonNetwork => [],
    :vmDirectPathGen2InactiveReasonOther => []
  )

  check <<-EOS, obj, 'DVPortStatus'
<root>
  <linkUp>1</linkUp>
  <blocked>false</blocked>
  <vlanIds>
    <start>5</start>
    <end>7</end>
  </vlanIds>
  <vlanIds>
    <start>10</start>
    <end>20</end>
  </vlanIds>
</root>
  EOS
end

def test_empty_array
  obj = VIM.DVPortStatus(
    :dynamicProperty => [],
    :linkUp => true,
    :blocked => false,
    :vlanIds => [],
    :vmDirectPathGen2InactiveReasonNetwork => [],
    :vmDirectPathGen2InactiveReasonOther => []
  )

  check <<-EOS, obj, 'DVPortStatus'
<root>
  <linkUp>1</linkUp>
  <blocked>false</blocked>
</root>
  EOS
end

  def test_fault
    obj = VIM.LocalizedMethodFault(
      :localizedMessage => "The attempted operation cannot be performed in the current state (Powered off).",
      :fault => VIM.InvalidPowerState(
        :requestedState => 'poweredOn',
        :existingState => 'poweredOff',
        :faultMessage => []
      )
    )

    check <<-EOS, obj, "LocalizedMethodFault"
<error xmlns:xsi="#{VIM::NS_XSI}">
  <fault xsi:type="InvalidPowerState">
    <requestedState>poweredOn</requestedState>
    <existingState>poweredOff</existingState>
  </fault>
  <localizedMessage>The attempted operation cannot be performed in the current state (Powered off).</localizedMessage>
</error>
    EOS
  end

  def test_wait_for_updates
    obj = VIM.UpdateSet(
      :version => '7',
      :dynamicProperty => [],
      :filterSet => [
        VIM.PropertyFilterUpdate(
          :dynamicProperty => [],
          :filter => VIM.PropertyFilter(nil, "session[528BA5EB-335B-4AF6-B49C-6160CF5E8D5B]71E3AC7E-7927-4D9E-8BC3-522769F22DAF"),
          :missingSet => [],
          :objectSet => [
            VIM.ObjectUpdate(
              :dynamicProperty => [],
              :kind => 'enter',
              :obj => VIM.VirtualMachine(nil, 'vm-1106'),
              :missingSet => [],
              :changeSet => [
                VIM.PropertyChange(
                  :dynamicProperty => [],
                  :name => 'runtime.powerState',
                  :op => 'assign',
                  :val => 'poweredOn'
                )
              ]
            )
          ]
        )
      ]
    )

    check <<-EOS, obj, "UpdateSet"
<returnval xmlns:xsi="#{VIM::NS_XSI}">
  <version>7</version>
  <filterSet>
    <filter type="PropertyFilter">session[528BA5EB-335B-4AF6-B49C-6160CF5E8D5B]71E3AC7E-7927-4D9E-8BC3-522769F22DAF</filter>
    <objectSet>
      <kind>enter</kind>
      <obj type="VirtualMachine">vm-1106</obj>
      <changeSet>
        <name>runtime.powerState</name>
        <op>assign</op>
        <val xsi:type="VirtualMachinePowerState">poweredOn</val>
      </changeSet>
    </objectSet>
  </filterSet>
</returnval>
    EOS
  end

  def test_binary
    obj = "\x00foo\x01bar\x02baz"
    check <<-EOS, obj, 'xsd:base64Binary'
<root>AGZvbwFiYXICYmF6</root>
    EOS
  end

  def test_hba
    obj = VIM::HostBlockHba(
      :dynamicProperty => [],
      :key => 'key-vim.host.BlockHba-vmhba0',
      :device => 'vmhba0',
      :bus => 0,
      :status => 'unknown',
      :model => 'Virtual Machine Chipset',
      :driver => 'ata_piix',
      :pci => '00:07.1')

    check <<-EOS, obj, "HostBlockHba"
<hostBusAdapter xsi:type="HostBlockHba">
  <key>key-vim.host.BlockHba-vmhba0</key>
  <device>vmhba0</device>
  <bus>0</bus>
  <status>unknown</status>
  <model>Virtual Machine Chipset</model>
  <driver>ata_piix</driver>
  <pci>00:07.1</pci>
</hostBusAdapter>
    EOS
  end

=begin
  def test_runtime_state
    obj = VIM::VirtualMachineDeviceRuntimeInfoVirtualEthernetCardRuntimeState(
      :dynamicProperty => [],
      vmDirectPathGen2:Active => false,
      vmDirectPathGen2:InactiveReasonOther => ["vmNptIncompatibleHost"],
      vmDirectPathGen2:InactiveReasonVm => []
    )
    check <<-EOS, obj, 'VirtualMachineDeviceRuntimeInfoDeviceRuntimeState'
<runtimeState xsi:type="VirtualMachineDeviceRuntimeInfoVirtualEthernetCardRuntimeState" xmlns:xsi="#{VIM::NS_XSI}">
  <vmDirectPathGen2Active>false</vmDirectPathGen2Active>
  <vmDirectPathGen2InactiveReasonOther>vmNptIncompatibleHost</vmDirectPathGen2InactiveReasonOther>
</runtimeState>
    EOS
  end
=end

  def test_runtime_info
    obj = VIM::VirtualMachineRuntimeInfo(
      :bootTime => Time.parse('2010-08-20 05:44:35 UTC'),
      :connectionState => "connected",
      :dynamicProperty => [],
      :faultToleranceState => "notConfigured",
      :host => VIM::HostSystem(nil, "host-32"),
      :maxCpuUsage => 5612,
      :maxMemoryUsage => 3072,
      :memoryOverhead => 128671744,
      :numMksConnections => 1,
      :powerState => "poweredOn",
      :recordReplayState => "inactive",
      :suspendInterval => 0,
      :toolsInstallerMounted => false,
      :device => []
    )

    check <<-EOS, obj, 'VirtualMachineRuntimeInfo'
<val xsi:type="VirtualMachineRuntimeInfo" xmlns:xsi="#{VIM::NS_XSI}">
  <host type="HostSystem">host-32</host>
  <connectionState>connected</connectionState>
  <powerState>poweredOn</powerState>
  <faultToleranceState>notConfigured</faultToleranceState>
  <toolsInstallerMounted>false</toolsInstallerMounted>
  <bootTime>2010-08-20T05:44:35.0Z</bootTime>
  <suspendInterval>0</suspendInterval>
  <memoryOverhead>128671744</memoryOverhead>
  <maxCpuUsage>5612</maxCpuUsage>
  <maxMemoryUsage>3072</maxMemoryUsage>
  <numMksConnections>1</numMksConnections>
  <recordReplayState>inactive</recordReplayState>
</val>
    EOS
  end

  def test_keyvalue
    obj = ['a', 'b']
    check <<-EOS, obj, 'KeyValue'
<root>
  <key>a</key>
  <value>b</value>
</root>
    EOS
  end

  def test_boolean
    check "<root>1</root>", true, 'xsd:boolean'
    check "<root>true</root>", true, 'xsd:boolean'
    check "<root>0</root>", false, 'xsd:boolean'
    check "<root>false</root>", false, 'xsd:boolean'
  end

  def test_int
    check "<root>5</root>", 5, 'xsd:byte'
    check "<root>5</root>", 5, 'xsd:short'
    check "<root>5</root>", 5, 'xsd:int'
    check "<root>5</root>", 5, 'xsd:long'
  end

  def test_float
    obj = 1.2
    check <<-EOS, obj, 'xsd:float'
<root>1.2</root>
    EOS
  end

  def test_date
    time_str = '2010-08-20T05:44:35.0Z'
    obj = Time.parse(time_str)
    check <<-EOS, obj, 'xsd:dateTime'
<root>#{time_str}</root>
    EOS
  end

  def test_array_mangling
    obj = ["foo"]
    check <<-EOS, obj, 'ArrayOfString'
<root><e>foo</e></root>
    EOS

    time_str = '2010-08-20T05:44:35.0Z'
    obj = [Time.parse(time_str)]
    check <<-EOS, obj, 'ArrayOfDateTime'
<root><e>#{time_str}</e></root>
    EOS

    obj = [1]
    check <<-EOS, obj, 'ArrayOfAnyType'
<root xmlns:xsi="#{VIM::NS_XSI}">
  <e xsi:type="xsd:int">1</e>
</root>
    EOS
  end

  def test_propertypath
    check "<root>foo</root>", "foo", 'PropertyPath'
  end

  def test_methodname
    check "<root>foo</root>", "foo", 'MethodName'
  end

  def test_typename
    check "<root>foo</root>", "foo", 'TypeName'
  end

  def test_new_fields
    obj = VIM::HostBlockHba(
      :dynamicProperty => [],
      :key => 'key-vim.host.BlockHba-vmhba0',
      :device => 'vmhba0',
      :bus => 0,
      :status => 'unknown',
      :model => 'Virtual Machine Chipset',
      :driver => 'ata_piix',
      :pci => '00:07.1')

    check <<-EOS, obj, "HostBlockHba"
<hostBusAdapter xsi:type="HostBlockHba">
  <key>key-vim.host.BlockHba-vmhba0</key>
  <device>vmhba0</device>
  <bus>0</bus>
  <status>unknown</status>
  <foo>bar</foo>
  <model>Virtual Machine Chipset</model>
  <driver>ata_piix</driver>
  <pci>00:07.1</pci>
</hostBusAdapter>
    EOS
  end
end
