Each project has it's own way of doing things. The following simple rules capture the OpenNebula dev team gitflow. Comments are welcome (contact@opennebula.io)!

OpenNebula branches
===================

master: latest development version (stable... to some extent)
one-X.Y: stable version (only bug fixing). No etc file changes. No migrator changes
feature-Z or bug-Z: to develop Z

New features are committed/merged to master
Bug fixing are committed/merged to master and cherry-picked to the currently active (ie, latest release) one-X.Y

Documentation
=============

master: Docs for latest development
one-X.Y: Docs for stable, automatically published
one-X.Y-maintenance: Docs for next stable release (one-X.Y.+1)

New features are documented on master and added to the What's New guide
Bugs are documented on master and cherry-picked one-X.Y-maintenance. Also, added to one-X.Y.maintenance Resolved Issues X.Y+1
Documentation bugs are committed to master and cherry-picked to one-X.Y (no need to port it to one-X.Y-maintenance)
