require_relative '../../src/vmm/scheduler/scripts/pci_affinity'
require 'test/unit'

module OpenNebula
  class TestPCIAffinity < Test::Unit::TestCase
    def setup
      # Mock NICs with PCI addresses and anti-affinity groups
      @nic1 = OpenStruct.new('PCI_ADDRESS' => '0000:03:00.0', 'PCI_ANTI_AFFINITY_GROUP' => 'group1')
      @nic2 = OpenStruct.new('PCI_ADDRESS' => '0000:03:00.1', 'PCI_ANTI_AFFINITY_GROUP' => 'group1')
      @nic3 = OpenStruct.new('PCI_ADDRESS' => '0000:03:00.0', 'PCI_ANTI_AFFINITY_GROUP' => 'group2')
      @nic4 = OpenStruct.new('PCI_ADDRESS' => '0000:04:00.0')
    end

    def test_anti_affinity_satisfied
      # Two NICs in same group with different PCI addresses -> ok
      nics = [@nic1, @nic2]
      host = OpenStruct.new(info: { 'HOST' => { 'PCI_DEVICES' => { 'PCI' => [] } } })
      assert_true(OpenNebula::PCIAffinity.check_anti_affinity(nics, host))
    end

    def test_anti_affinity_violated
      # Two NICs in same group with same PCI address -> fail
      nics = [@nic1, @nic1]  # same object for simplicity
      host = OpenStruct.new(info: { 'HOST' => { 'PCI_DEVICES' => { 'PCI' => [] } } })
      assert_false(OpenNebula::PCIAffinity.check_anti_affinity(nics, host))
    end

    def test_no_group_no_constraints
      nics = [@nic3, @nic4]
      host = OpenStruct.new(info: { 'HOST' => { 'PCI_DEVICES' => { 'PCI' => [] } } })
      assert_true(OpenNebula::PCIAffinity.check_anti_affinity(nics, host))
    end
  end
end
