# GOCA 

The Go bindings to interact with OpenNebula. 

To use it, you have to define a client, and give it to the controller, then you can make calls: 

```
conf := goca.NewConfig("user", "pass", "endpoint") // the fields can be empty if you use
                                                   // environment variables (See ONE documentation)  
c := goca.NewClient(conf)  
ctrl := goca.NewController(c)
```  
 
The way to interact with ONE entities follow this scheme:  
```
vm, err := ctrl.VM(id).Info() // Retrieve VM informations
err := ctrl.VM(id).Delete()   // Delete a VM
vms, err := ctrl.VMs().Info() // Retrieve a list of VM informations (with less informations per instance)
id, err := ctrl.VMByName("vm_name") // Retrieve an ID by name
``` 

For more information, there is some basic pieces of code in examples directory. 
 
The provided goca client is a basic client, without concurrency features, but re-define your own client based on it, or use your own xml-rpc client.
All you need to do is to follow the RPCCaller interface, then give it to the controller. 
 

 
Be careful, entities from XXXs().Info() and XXX().Info() method doesn't return the same level of informations for a given entity. 
See example/vm_get_info.go for an example of use of theses two info Methods. 
