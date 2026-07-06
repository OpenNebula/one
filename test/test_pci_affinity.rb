require 'test/unit'
require_relative '../src/pci_manager'
require_relative '../src/vm_template'

class TestPCIAffinity < Test::Unit::TestCase
  def setup
    @vm_xml = <<-XML
    <VM>
      <TEMPLATE>
        <NIC>
          <PCI>0000:02:00.0</PCI>
          <PCI_ANTI_AFFINITY>group1</PCI_ANTI_AFFINITY>
        </NIC>
        <NIC>
          <PCI>0000:02:00.1</PCI>
          <PCI_ANTI_AFFINITY>group1</PCI_ANTI_AFFINITY>
        </NIC>
        <NIC>
          <PCI>0000:03:00.0</PCI>
          <PCI_ANTI_AFFINITY>group1</PCI_ANTI_AFFINITY>
        </NIC>
      </TEMPLATE>
    </VM>
    XML
    @vm = OpenNebula::VirtualMachine.new(@vm_xml)
  end

  def test_pci_anti_affinity_groups
    groups = @vm.pci_anti_affinity_groups
    expected = { 'group1' => [ '0000:02:00.0', '0000:02:00.1', '0000:03:00.0' ] }
    assert_equal(expected, groups)
  end

  def test_get_pf_address
    assert_equal('0000:02:00.0', OpenNebula::PCIManager.get_pf_address('0000:02:00.3'))
    assert_equal('0000:02:00.0', OpenNebula::PCIManager.get_pf_address('0000:02:00.0'))
  end

  def test_same_physical_nic?
    assert(OpenNebula::PCIManager.same_physical_nic?('0000:02:00.0', '0000:02:00.1'))
    assert(!OpenNebula::PCIManager.same_physical_nic?('0000:02:00.0', '0000:03:00.0'))
  end
end
