
for i in group_pool group host_pool host image_pool image template_pool template user_pool user vm_pool vm vnet_pool vnet
do
    xmllint --noout --schema $i.xsd samples/$i/*
done