require 'json'

module Parser
    def self.parse_body(request)
        JSON.parse request.body.read
    end

    def self.generate_body(hash)
        JSON.pretty_generate hash
    end

    UNITS = %W(B KiB MiB GiB TiB).freeze

    def self.humanize_size(number)
      if number.to_i < 1024
        exponent = 0

      else
        max_exp  = UNITS.size - 1

        exponent = ( Math.log( number ) / Math.log( 1024 ) ).to_i # convert to base
        exponent = max_exp if exponent > max_exp # we need this to avoid overflow for the highest unit

        number  /= 1024 ** exponent
      end

      "#{number} #{UNITS[ exponent ]}"
    end
end