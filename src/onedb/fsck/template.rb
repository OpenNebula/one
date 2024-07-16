
module OneDBFsck
    def check_template
        templates_fix = @fixes_template = {}

        @db[:template_pool].each do |row|
            doc  = nokogiri_doc(row[:body], 'template_pool')
            boot = doc.root.at_xpath("TEMPLATE/OS/BOOT")
            uid  = doc.root.at_xpath('UID').content

            check_ugid(doc)

            error_perm = fix_permissions('VMTEMPLATE', row[:oid], doc)

            if boot.nil? || boot.text.downcase.match(/fd|hd|cdrom|network/).nil?
                templates_fix[row[:oid]] = doc.root.to_s if error_perm
                next
            end

            # Note: this code assumes that disks are ordered in the same order as
            # their target, and may break boot order if the target is not left
            # completely to oned.
            # If, for example, the third disk ends with target="vda",
            # boot="hd" should be updated to boot="disk2", but it is not

            devs = []

            hd_i      = 0
            cdrom_i   = 0
            network_i = 0

            error = false

            boot.text.split(",").each do |dev|
                dev.downcase!

                case dev
                when "hd", "cdrom"
                    index = nil
                    if dev == "hd"
                        index = hd_i
                        hd_i += 1
                    else
                        index = cdrom_i
                        cdrom_i += 1
                    end

                    id = get_disk_id(dev, index, doc, uid)

                    if id.nil?
                        log_error("VM Template #{row[:oid]} OS/BOOT contains deprecated format \"#{boot.content}\", but DISK ##{index} of type #{dev} could not be found to fix it automatically", false)
                        error = true
                    end
                    devs.push("disk#{id}")

                when "network"
                    devs.push("nic#{network_i}")
                    network_i += 1

                when "fd"
                    log_error("VM Template #{row[:oid]} OS/BOOT contains deprecated format \"#{boot.content}\", but \"fd\" is not supported anymore and can't be fixed automatically", false)
                    error = true

                else
                    log_error("VM Template #{row[:oid]} OS/BOOT contains deprecated format \"#{boot.content}\", but it can't be parsed to be fixed automatically", false)
                    error = true
                end
            end

            if error
                # Unrepairable error detected
                templates_fix[row[:oid]] = doc.root.to_s if error_perm

                next
            end

            new_boot = devs.join(",")

            log_error("VM Template #{row[:oid]} OS/BOOT contains deprecated format \"#{boot.content}\", is was updated to #{new_boot}")

            boot.content = new_boot

            templates_fix[row[:oid]] = doc.root.to_s
        end
    end

    def fix_template
        @db.transaction do
            @fixes_template.each do |id, body|
                @db[:template_pool].where(oid: id).update(body: body)
            end
        end
    end
end

