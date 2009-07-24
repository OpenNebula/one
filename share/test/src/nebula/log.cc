#include "Log.h"
#include <sstream>

int main()
{
    Log log("file.log");
    
    ostringstream message;    
    message << "pepe";

    log.log("module", Log::ERROR, message);
    
    return 0;
}

