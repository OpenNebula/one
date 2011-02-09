These two .dot files are graphviz[1] DOT language graphs.

The complete state diagram uses the internal names for all the LifeCycleManager states, and the transitions triggered by the onevm commands. It is intended to be consulted by developers.

The simplified diagram uses a smaller number of state names. These names are the ones used by onevm list, e.g. prolog, prolog_migrate and prolog_resume are all presented as "prol". It is intended as a reference for end-users.

To generate png files, use the following commands:
dot -Tpng states-complete.dot -o states-complete.png
dot -Tpng states-simple.dot -o states-simple.png


[1] http://www.graphviz.org/