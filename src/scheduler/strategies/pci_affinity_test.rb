# Unit test for PCI affinity scheduling extension
require_relative 'pci_affinity'
require 'test/unit'

class TestPCIAffinity < Test::Unit::TestCase
  def test_parse_pci_affinity_antiaffinity
    vm_template = {
      'PCI_GROUPS' => [
        {
          'PCI_ADDRESSES' => ['0000:00:01.0', '0000:00:02.0'],
          'AFFINITY_TYPE' => 'antiaffinity'
        }
      ]
    }
    vm = OpenStruct.new(template: vm_template)
    constraints = PCIAffinity.parse_pci_affinity(vm)
    assert_equal 1, constraints[:antiaffinity].size
    assert_equal 0, constraints[:affinity].size
  end

  def test_check_antiaffinity_violated
    constraints = {
      affinity: [],
      antiaffinity: [['0000:00:01.0', '0000:00:02.0']]
    }
    assignments = { 'vm1' => ['0000:00:01.0', '0000:00:02.0'] }
    assert_false PCIAffinity.check_affinity_constraints(assignments, constraints)
  end

  def test_check_antiaffinity_ok
    constraints = { affinity: [], antiaffinity: [['0000:00:01.0', '0000:00:02.0']] }
    assignments = { 'vm1' => ['0000:00:01.0'], 'vm2' => ['0000:00:02.0'] }
    assert PCIAffinity.check_affinity_constraints(assignments, constraints)
  end

  def test_check_affinity_violated
    constraints = { affinity: [['0000:00:01.0', '0000:00:02.0']], antiaffinity: [] }
    assignments = { 'vm1' => ['0000:00:01.0'] }
    assert_false PCIAffinity.check_affinity_constraints(assignments, constraints)
  end

  def test_check_affinity_ok
    constraints = { affinity: [['0000:00:01.0', '0000:00:02.0']], antiaffinity: [] }
    assignments = { 'vm1' => ['0000:00:01.0', '0000:00:02.0'] }
    assert PCIAffinity.check_affinity_constraints(assignments, constraints)
  end
end
