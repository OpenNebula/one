
# Overview

Installing services can sometimes be tedious. Getting the VM ins good shape, installing the packages needed, deploying the application and configuring it. On case of disaster or scaling the service you will need to perform again these tasks. To automate all this burden we now have Configuration Management software like [chef](http://www.opscode.com/chef/), [puppet](http://puppetlabs.com/puppet/what-is-puppet/) or [cfengine](http://cfengine.com/).

With this software we can script the installation and configuration of applications and services. You can also describe the services and their configuration that will be installed on a node so we can automate its installation. We will also be sure that each installation will be equal to other using the same configuration.

The tool onestage will make use of [chef-solo](http://wiki.opscode.com/display/chef/Chef+Solo). It lets you register chef configurations and instantiate them using predefined templates and images.

# Guide

The first step you need to do is to prepare an OS image to be able to use chef recipes from contextualization (link to guide) or download an already prepared image from the marketplace. Then we need to create a template referring to this image.

The next step will be describing our new node. You can follow the [chef guide](http://wiki.opscode.com/display/chef/Nodes) to understand these files. For these examples we are going to use this file:

    {
      "name": "wordpress",
      "run_list": [
        "recipe[mysql::server]",
        "recipe[wordpress]"
      ],
      "wordpress": {
        "db": {
          "database": "${WP_DB_NAME|wordpress}",
          "user": "${WP_DB_USER|wordpress}",
          "password": "${WP_DB_PASSWORD|password}"
        }
      },
      "mysql": {
        "server_root_password": "${MYSQL_ROOT_PASSWORD|password}"
      }
    }

The node files are JSON encoded and contain the recipes that are going to be run on the VM and parameters that will be used to install and configure the software. You will notice that there are some strange values in this form:

    ${WP_DB_NAME|wordpress}

onestage comes with a template engine that will let you create node files with variables. These variables are named and can contain default values. the form is:

    ${NAME[|<default value>]}

The name will be used to refer to it on VM instantiation (we will see this later on) and the default value will substitute the variable if it is not explicitly specified.

We save this file as node.json and now comes the registration part. onestage will let us register it in the OpenNebula database. To register the node file we can use the command `onestage create`:

    $ onestage create node.json
    21

The number returned is the identifier to our newly registered node file. We can also specify some parameters:

     -n, --name name           Name of the role
     -t, --templates t1,t2     Templates compatible with the role
     -c, --cookbooks cookbooks URL to extra cookbooks

On VM creation the recipes specified in the node file will be automatically downloaded from the standard chef cookbooks repository but we can specify a URL of a tar.gz containing extra cookbooks that you have created. For example:

    $ onestage create --name my_blog --templates ubuntu,centos --cookbooks http://some.url.com/cookbooks.tar.gz node.json
    22

We can list the nodes we already have defined:

    $ onestage list
       ID             NAME
       21        wordpress
       22          my_blog

And show the properties:

    $ ./onestage show my_blog
    ROLE 22 INFORMATION                                                             
    ID                  : 22                  
    NAME                : my_blog             
    USER                : oneadmin            
    GROUP               : oneadmin            
    COMPATIBLE TEMPLATES: ubuntu, centos      
    COOKBOOKS           : http://some.url.com/cookbooks.tar.gz

    PERMISSIONS                                                                     
    OWNER               : um-                 
    GROUP               : ---                 
    OTHER               : ---                 

    DEFAULT VARIABLES                                                               
    WP_DB_NAME          : wordpress           
    WP_DB_USER          : wordpress           
    WP_DB_PASSWORD      : password            
    MYSQL_ROOT_PASSWORD : password            

    ROLE DEFINITION                                                                 
    {
      "name": "wordpress",
      "run_list": [
        "recipe[mysql::server]",
        "recipe[wordpress]"
      ],
      "wordpress": {
        "db": {
          "database": "${WP_DB_NAME|wordpress}",
          "user": "${WP_DB_USER|wordpress}",
          "password": "${WP_DB_PASSWORD|password}"
        }
      },
      "mysql": {
        "server_root_password": "${MYSQL_ROOT_PASSWORD|password}"
      }
    }

There we can see the node file and its properties. It is also handy the default variables. Those are the ones we can change on instantiation.

We will be also able to update the node file using `onestage update <node>`. A text editor will be run letting us modify the node file.

To instantiate a VM that will use this node we will use the command `onestage instantiate <template> <node>`. This command will also let us change the variables in the node using the parameter `-d`. For example:

    $ onestage instantiate ubuntu my_blog -d WP_DB_NAME=myblog,MYSQL_ROOT_PASSWORD=some_other_password

Now we can check that a new VM was created:

    $ onevm list
        ID USER     GROUP    NAME            STAT UCPU    UMEM HOST             TIME
        16 oneadmin oneadmin ubuntu          pend    0      0K              0d 00h00

And that the contextualization contains the parameters we provided:

    $ onevm show 16
    [...]
    VIRTUAL MACHINE TEMPLATE                                                        
    CONTEXT=[
      COOKBOOKS="http://some.url.com/cookbooks.tar.gz",
      MYSQL_ROOT_PASSWORD="some_other_password",
      ROLE="eyJuYW1lIjoid29yZHByZXNzIiwicnVuX2xpc3QiOlsicmVjaXBlW215c3FsOjpzZXJ2ZXJdIiwicmVjaXBlW3dvcmRwcmVzc10iXSwid29yZHByZXNzIjp7ImRiIjp7ImRhdGFiYXNlIjoiJHtXUF9EQl9OQU1FfHdvcmRwcmVzc30iLCJ1c2VyIjoiJHtXUF9EQl9VU0VSfHdvcmRwcmVzc30iLCJwYXNzd29yZCI6IiR7V1BfREJfUEFTU1dPUkR8cGFzc3dvcmR9In19LCJteXNxbCI6eyJzZXJ2ZXJfcm9vdF9wYXNzd29yZCI6IiR7TVlTUUxfUk9PVF9QQVNTV09SRHxwYXNzd29yZH0ifX0=",
      TARGET="hdb",
      WP_DB_NAME="myblog" ]
    [...]

These parameters will be used by the contextualization script inside the VM image and will install the described node.


# Preparing the VM

The VM images where these configurations will be applied need to be prepared to use the contextualization information provided by onestage. The requirements are:

* chef-solo installed
* ruby installed
* OpenNebula contextualization+chef scripts package installed

To install chef solo you can follow [chef guides](http://wiki.opscode.com/display/chef/Installing+Chef+Client+and+Chef+Solo). Those guides have instructions on how to install it on various distributions. Most probably you wont need to install ruby as it is a chef requirement so after installing chef-solo you will have it available.

The OpenNebula contextualization package can be found at the [download page](http://downloads.c12g.com/context). There are two versions, one for rpm based distributions (CentOS/RedHat) and another for debian ones (Debian/Ubuntu).

Installing the contstualization package will enable the machine to use OpenNebula network configuration. Will clean udev configuration that could create errors and install the `script one-chef` that will launch chef on start.






