# Copyright (c) 2010 VMware, Inc.  All Rights Reserved.
module RbVmomi

# @private
# @deprecated Use +RbVmomi::VIM.connect+.
def self.connect opts
  VIM.connect opts
end

end

require File.dirname(__FILE__) + '/rbvmomi/connection'
require File.dirname(__FILE__) + '/rbvmomi/vim/vim'
