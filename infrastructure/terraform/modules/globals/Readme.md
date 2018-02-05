## Module for global values

Since globals is pretty much just a variables and outputs module, all are combined in a single file.
Should that change at some point, may want to consider separating into individual files.

At the moment the setup of passing a bunch of variables into globals and outputting them, only to reference them in the next module, may seem odd.
This is partially so that these things end up in the state to be used at deploy-time if necessary, but there is also functionality forthcoming that will allow passing the entire output of a module as an input to another module, which will simplify things significantly.  We're basically going ahead and preparing for that feature.