# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
# -------------------------------------------------------------------------- #

module OneKS

    # AES-256-GCM wire format used by the in-cluster CAPONE monitor
    class MonitorPayload

        KEY_BYTES   = 32
        NONCE_BYTES = 12
        TAG_BYTES   = 16

        def self.generate_key
            Base64.strict_encode64(SecureRandom.random_bytes(KEY_BYTES))
        end

        def self.encode(data, encoded_key)
            key = Base64.strict_decode64(encoded_key.to_s)

            return OpenNebula::Error.new(
                "Invalid monitor encryption key: expected #{KEY_BYTES} bytes, " \
                "got #{key.bytesize}",
                ODS::ResponseHelper::VALIDATION_EC
            ) unless key.bytesize == KEY_BYTES

            cipher = OpenSSL::Cipher.new('aes-256-gcm')
            nonce  = SecureRandom.random_bytes(NONCE_BYTES)

            cipher.encrypt
            cipher.key       = key
            cipher.iv        = nonce
            cipher.auth_data = ''

            ciphertext = cipher.update(data.to_json) + cipher.final

            Base64.strict_encode64(nonce + ciphertext + cipher.auth_tag)
        rescue ArgumentError => e
            OpenNebula::Error.new(
                "Error encoding encrypted monitor payload: #{e.message}",
                ODS::ResponseHelper::VALIDATION_EC
            )
        end

        def self.decode(payload, encoded_key, schema:, root: nil)
            key = Base64.strict_decode64(encoded_key.to_s)
            raw = Base64.strict_decode64(payload.to_s)

            return OpenNebula::Error.new(
                "Invalid monitor encryption key: expected #{KEY_BYTES} bytes, " \
                "got #{key.bytesize}",
                ODS::ResponseHelper::VALIDATION_EC
            ) unless key.bytesize == KEY_BYTES

            min_payload_bytes = NONCE_BYTES + TAG_BYTES
            return OpenNebula::Error.new(
                'Invalid encrypted monitor payload: expected at least ' \
                "#{min_payload_bytes} bytes, got #{raw.bytesize}",
                ODS::ResponseHelper::VALIDATION_EC
            ) if raw.bytesize < min_payload_bytes

            nonce      = raw.byteslice(0, NONCE_BYTES)
            ciphertext = raw.byteslice(NONCE_BYTES, raw.bytesize - NONCE_BYTES - TAG_BYTES)
            tag        = raw.byteslice(-TAG_BYTES, TAG_BYTES)

            cipher = OpenSSL::Cipher.new('aes-256-gcm')
            cipher.decrypt
            cipher.key       = key
            cipher.iv        = nonce
            cipher.auth_tag  = tag
            cipher.auth_data = ''

            decoded = JSON.parse(
                cipher.update(ciphertext) + cipher.final, :symbolize_names => true
            )
            return OpenNebula::Error.new(
                'Invalid decrypted monitor payload: expected a JSON object',
                ODS::ResponseHelper::VALIDATION_EC
            ) unless root || decoded.is_a?(Hash)

            # Wrap root collections because Dry::Validation contracts expect a hash input
            validation = schema.new.call(root ? { root => decoded } : decoded)
            return OpenNebula::Error.new(
                "Error validating monitor payload schema: #{validation.errors.to_h}",
                ODS::ResponseHelper::VALIDATION_EC
            ) if validation.failure?

            validated = validation.to_h
            root ? validated[root] : validated
        rescue ArgumentError => e
            OpenNebula::Error.new(
                "Error decoding encrypted monitor payload: #{e.message}",
                ODS::ResponseHelper::VALIDATION_EC
            )
        rescue JSON::ParserError => e
            OpenNebula::Error.new(
                "Error parsing decrypted monitor payload: #{e.message}",
                ODS::ResponseHelper::VALIDATION_EC
            )
        rescue OpenSSL::Cipher::CipherError => e
            OpenNebula::Error.new(
                "Error decrypting monitor payload: #{e.message}",
                ODS::ResponseHelper::VALIDATION_EC
            )
        end

    end

end
