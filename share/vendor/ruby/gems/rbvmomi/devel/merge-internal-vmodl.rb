#!/usr/bin/env ruby
# These types are not public and so may change between releases. Do not
# use them directly.

public_vmodl_filename = ARGV[0] or abort "public vmodl filename required"
internal_vmodl_filename = ARGV[1] or abort "internal vmodl filename required"
output_vmodl_filename = ARGV[2] or abort "output vmodl filename required"

TYPES = %w(
DVSKeyedOpaqueData
DVSOpaqueDataConfigSpec
DVPortgroupSelection
DVPortSelection
DVSSelection
DynamicTypeEnumTypeInfo
DynamicTypeMgrAllTypeInfo
DynamicTypeMgrAnnotation
DynamicTypeMgrDataTypeInfo
DynamicTypeMgrFilterSpec
DynamicTypeMgrManagedTypeInfo
DynamicTypeMgrMethodTypeInfo
DynamicTypeMgrMethodTypeInfoAnnotationType
DynamicTypeMgrMoFilterSpec
DynamicTypeMgrMoInstance
DynamicTypeMgrParamTypeInfo
DynamicTypeMgrParamTypeInfoAnnotationType
DynamicTypeMgrPropertyTypeInfo
DynamicTypeMgrPropertyTypeInfoAnnotationType
DynamicTypeMgrTypeFilterSpec
InternalDynamicTypeManager
ReflectManagedMethodExecuter
ReflectManagedMethodExecuterSoapArgument
ReflectManagedMethodExecuterSoapFault
ReflectManagedMethodExecuterSoapResult
SelectionSet
)

METHODS = %w(
DistributedVirtualSwitchManager.UpdateDvsOpaqueData_Task
HostSystem.RetrieveDynamicTypeManager
HostSystem.RetrieveManagedMethodExecuter
)

public_vmodl = File.open(public_vmodl_filename, 'r') { |io| Marshal.load io }
internal_vmodl = File.open(internal_vmodl_filename, 'r') { |io| Marshal.load io }

TYPES.each do |k|
  puts "Merging in #{k}"
  fail unless internal_vmodl.member? k
  public_vmodl[k] = internal_vmodl[k]
end

METHODS.each do |x|
  puts "Merging in #{x}"
  type, method = x.split '.'
  public_vmodl[type]['methods'][method] = internal_vmodl[type]['methods'][method] or fail
end

File.open(output_vmodl_filename, 'w') { |io| Marshal.dump public_vmodl, io }
