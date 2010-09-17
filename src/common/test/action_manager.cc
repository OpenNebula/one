#include "ActionManager.h"

#include <string>
#include <iostream>
#include <map>

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>

#include "test/one_test_common.h"

using namespace std;

extern "C" void * addsub_loop(void *arg);

class AddSub : public ActionListener
{
public:
    AddSub(int i):am(),counter(i)
    {
        am.addListener(this);
    };
    
    ~AddSub(){};

    void add(int i)
    {
        int * p;

        p = new int(i);

        am.trigger("ADD",(void *) p);
    }

    void sub(int i)
    {
        int * p;

        p = new int(i);

        am.trigger("SUB",(void *) p);
    }

    int value() 
    {
        return counter;
    }

    pthread_t id() 
    {
        return pid;
    }

    void start()
    {
        pthread_attr_t pattr;

        pthread_attr_init (&pattr);
        pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

        pthread_create(&pid,&pattr,addsub_loop,(void *) this);
    }
    
    void end()
    {
        am.trigger(ActionListener::ACTION_FINALIZE,0);
    }

private:
    ActionManager am;

    int          counter;
    pthread_t    pid;

    friend void * addsub_loop(void *arg);

    void do_action(const string &action, void * arg)
    {
        int * i = static_cast<int *>(arg);

        if ( i == 0 )
        {
            return;
        }
        else if ( action == "ADD" )
        {
            counter = counter + *i;
        }
        else if ( action == "SUB" )
        {
            counter = counter - *i;
        }

        delete i;
    }
};

extern "C" void * addsub_loop(void *arg)
{
    AddSub *as;

    as = static_cast<AddSub *>(arg);

    as->am.loop(0,0);

    return 0;
};

class ActionManagerTest : public CppUnit::TestFixture 
{
private:
    AddSub  *as;

public:
    void setUp()
    {
        as = new AddSub(10);
        as->start();
    }

    void tearDown()
    {
        delete as;
    }

    void test_add()
    {
        as->add(23);
        as->add(5);

        sleep(1);

        CPPUNIT_ASSERT(as->value() == 38);

        as->end();

        pthread_join(as->id(),0);

        CPPUNIT_ASSERT(as->value() == 38);
    }

    void test_sub()
    {
        as->sub(3);
        as->sub(15);

        sleep(1);

        CPPUNIT_ASSERT(as->value() == -8);

        as->end();

        pthread_join(as->id(),0);

        CPPUNIT_ASSERT(as->value() == -8);
    }

    static CppUnit::TestSuite * suite()
    {
        CppUnit::TestSuite *ts=new CppUnit::TestSuite("ActionManager Tests");

        ts->addTest(new CppUnit::TestCaller<ActionManagerTest>(
                    "add() Test",
                    &ActionManagerTest::test_add));

        ts->addTest(new CppUnit::TestCaller<ActionManagerTest>(
                    "sub() Test",
                    &ActionManagerTest::test_sub));
        return ts;
    }
};

int main(int argc, char ** argv)
{
    
    CppUnit::TextUi::TestRunner tr;

    SETUP_XML_WRITER(tr, "action_manager.xml");
    
    tr.addTest(ActionManagerTest::suite());
    tr.run();

    END_XML_WRITER

    return 0;
}
