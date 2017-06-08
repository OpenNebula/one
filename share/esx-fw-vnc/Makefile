.PHONY: fw-vnc.vib clean

fw-vnc.vib: vmware-esx-vib-author-5.0.0-0.0.847598.i386.rpm
	vagrant plugin install vagrant-sshfs
	vagrant up
	vagrant destroy -f
	@echo "Package successfully $@ built"

vmware-esx-vib-author-5.0.0-0.0.847598.i386.rpm:
	wget -O $@ https://download3.vmware.com/software/vmw-tools/vibauthor/vmware-esx-vib-author-5.0.0-0.0.847598.i386.rpm

clean:
	-rm -rf fw-vnc.vib fw-vnc.zip vmware-esx-vib-author*.rpm
	-vagrant destroy -f
