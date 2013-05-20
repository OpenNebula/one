class RbVmomi::VIM::ObjectContent
  # Represent this ObjectContent as a hash.
  # @return [Hash] A hash from property paths to values.
  def to_hash
    @cached_hash ||= to_hash_uncached
  end

  # Alias for +to_hash[k]+.
  def [](k)
    to_hash[k]
  end

  private

  def to_hash_uncached
    h = {}
    propSet.each do |x|
      fail if h.member? x.name
      h[x.name] = x.val
    end
    h
  end
end
