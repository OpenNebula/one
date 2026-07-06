# Test for PciAddressAffinityPolicy
require_relative '../../src/scheduler/scheduling_policies/pci_address_affinity_policy'
require 'minitest/autorun'

class TestPciAddressAffinityPolicy < Minitest::Test
  def setup
    @policy = PciAddressAffinityPolicy.new
    @vm_affinity = {
      'ID' => 1,
      'PCI_ADDRESS_AFFINITY' => 'YES',
      'NIC' => [{'PCI_ADDRESS' => '0000:04:00.0'}, {'PCI_ADDRESS' => '0000:04:00.1'}]
    }
    @vm_antiaffinity = {
      'ID' => 2,
      'PCI_ADDRESS_ANTIAFFINITY' => 'YES',
      'NIC' => [{'PCI_ADDRESS' => '0000:04:00.0'}]
    }
    @host1 = {
      'NAME' => 'host1',
      'VM_PCI' => [{'ADDRESS' => '0000:04:00.2'}, {'ADDRESS' => '0000:04:00.3'}]
    }
    @host2 = {
      'NAME' => 'host2',
      'VM_PCI' => [{'ADDRESS' => '0000:04:00.0'}, {'ADDRESS' => '0000:04:00.1'}]
    }
  end

  def test_affinity_filter
    # VM wants affinity, host2 has both PCI addresses
    result = @policy.filter(@vm_affinity, [@host1, @host2])
    assert_equal [@host2], result
  end

  def test_antiaffinity_filter
    # VM wants anti-affinity, host1 does not have 0000:04:00.0
    result = @policy.filter(@vm_antiaffinity, [@host1, @host2])
    assert_equal [@host1], result
  end

  def test_no_pci_addresses
    vm_no_pci = {'ID' => 3, 'NIC' => [{'MAC' => '00:11:22:33:44:55'}]}
    result = @policy.filter(vm_no_pci, [@host1, @host2])
    assert_equal [@host1, @host2], result
  end
end
