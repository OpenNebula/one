#include "ActionManager.h"
#include <iostream>
#include <cerrno>

class AMTest : public ActionListener
{
public:
    AMTest():am()
    {
        am.addListener(this);
    };
    
    ~AMTest(){};

    ActionManager   am;
    
private:
    void do_action(const string &action, void * arg);
};

void AMTest::do_action(const string &action, void * arg)
{
    int * i = static_cast<int *>(arg);

    cout<<"Event received: "<<action<<" Argument : "<<*i<<"\n";
}

extern "C" void * startThread(void *arg)
{
    AMTest *    MT;
    int         i = 8;
    string      event("ACTION_TEST");

    MT = static_cast<AMTest *> (arg);

    MT->am.trigger(event,&i);

    sleep(4);

    i = 10;

    MT->am.trigger(event,&i);
    
    i = 23;

    MT->am.trigger(ActionListener::ACTION_FINALIZE,&i);

    return 0;
}
/*
int main()
{
    pthread_t   id;
    int         i = 3;
    AMTest * MT = new AMTest();

    pthread_create(&id, 0, startThread, MT);
    
    MT->am.loop(1,&i);
    
    delete MT;

    pthread_join(id,0);

    return 0;
}
*/
