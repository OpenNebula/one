
#include <cppunit/XmlOutputter.h>

#define SETUP_XML_WRITER(runner, output) \
        ofstream outputFile(output);                                      \
        CppUnit::XmlOutputter* outputter =                                \
          new CppUnit::XmlOutputter(&runner.result(), outputFile);        \
                                                                          \
        runner.setOutputter(outputter);

#define END_XML_WRITER outputFile.close();

