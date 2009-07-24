#include "VirtualMachineTemplate.h"
#include <iostream>
#include <sqlite3.h>
#include <sstream>


int main()
{
    VirtualMachineTemplate tmp;
    Template t;

    char *error;
    string st("MEMORY=345\nCPU=4\nDISK=[FILE=\"img\",TYPE=cd]\nDISK=[FILE=\"../f\"]\n");
    
 
    ostringstream os;
    
    if ((tmp.parse("vm.template",&error) != 0 ) &&
        (error != 0))
    {
        cout << "Error parsing file: "<< error << endl;
        
        free(error);   
    }
    
    string mrs;
    
    tmp.marshall(mrs,':');
    
    cout << "-" << mrs << "-";

    if ((t.parse(st,&error) != 0 ) &&
        (error != 0))
    {
        cout << "Error parsing string: "<< error << endl;
        
        free(error);   
    }
    cout << "TEMPLATE" << endl << t << endl;
    cout << "------" << endl << endl;
    cout << "TEMPLATE" << endl << tmp << endl;
    
    string mm("MEMORY");
    vector<const Attribute*> values;

    tmp.get(mm,values);
 
    const SingleAttribute  *pmemo;
        
    pmemo = static_cast<const SingleAttribute *>(values[0]);
    
    cout << "MEM = " << pmemo->value() << "\n"; 

    cout << "TEMPLATE--" << endl << t << endl;
    
    // ---- Init template DB ---- 
    /*
     
    sqlite3 *       db;
    sqlite3_open("template.db", &db);
    
    sqlite3_exec(db,
        "CREATE TABLE vm_template (id INTEGER,"
        "name TEXT, value TEXT)",
        0,
        0,
        0);
        
    cout <<  tmp.insert(db) << endl;
    
    VirtualMachineTemplate rtmp(2);
    
    rtmp.select(db);
    
    cout << endl << "FROM DB" << endl << rtmp;
    
    sqlite3_close(db);
    
    */
    return 0;
}


/*
int main()
{
    TemplateAttribute<string>   sa1("ejemplo","valor");
    TemplateAttribute<string>   sa2("sample","value");
//    Attribute *                 pa;
//    Attribute *                 pa2;
    
    cout << sa1.name() << ":" << sa1.value() << "\n";
    cout << sa2.name() << ":" << sa2.value() << "\n";
    
    
    cout << sa2.name() << ":" << sa2.value() << "\n";
    
    
    
    
    //map<string, Attribute *>    mymap;
    //TemplateAttribute<string> * pta;
    
    
    
    //pa = new TemplateAttribute<string>("ejemplo","valor");
    
    //cout << str_attr.name();
    //cout << pa->name();
    
    //pta = static_cast<TemplateAttribute<string> *> (pa);
    
    //cout << pa->name();
    
    //mymap.insert(make_pair("cadena",pa));
    
    //delete pa;
    
    return 0;
}
*/

