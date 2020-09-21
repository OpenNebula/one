import React, { useEffect, useState, useCallback, createContext } from 'react';

import * as yup from 'yup';
import { useWatch } from 'react-hook-form';

import { Add as AddIcon, Refresh as RefreshIcon } from '@material-ui/icons';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  addEdge
} from 'react-flow-renderer';
import dagre from 'dagre';

import useListForm from 'client/hooks/useListForm';
import FormStepper from 'client/components/FormStepper';
import { DialogForm } from 'client/components/Dialogs';
import { generateFlow } from 'client/utils/flow';
import SpeedDials from 'client/components/SpeedDials';

import Steps from './Steps';
import CustomNode from './Flow/CustomNode';

export const Context = createContext({});
export const STEP_ID = 'tiers';

const Tiers = () => {
  const { steps, defaultValues, resolvers } = Steps();

  return {
    id: STEP_ID,
    label: 'Tier Definition',
    resolver: yup
      .array()
      .of(resolvers)
      .min(1)
      .required()
      .default([]),
    content: useCallback(({ data, setFormData }) => {
      const [flow, setFlow] = useState([]);
      const [showDialog, setShowDialog] = useState(false);
      const [nestedForm, setNestedForm] = useState({});
      const form = useWatch({});

      const { editingData, handleEdit, handleSave } = useListForm({
        key: STEP_ID,
        list: data,
        setList: setFormData,
        defaultValue: defaultValues
      });

      const graph = new dagre.graphlib.Graph();
      graph.setGraph({});
      graph.setDefaultEdgeLabel(() => ({}));

      const reDrawFlow = () => {
        setFlow(
          generateFlow(
            graph,
            data?.map((item, index) => ({
              id: item.tier.name,
              type: 'tier',
              data: {
                ...item,
                handleEdit: () => {
                  handleEdit(index);
                  setShowDialog(true);
                }
              },
              parents: item.tier.parents ?? []
            })) ?? []
          )
        );
      };

      useEffect(() => {
        setNestedForm(form);
      }, []);

      const actions = [
        {
          icon: <AddIcon />,
          name: 'Add',
          handleClick: () => {
            handleEdit();
            setShowDialog(true);
          }
        },
        {
          icon: <RefreshIcon />,
          name: 'Refresh',
          handleClick: () => reDrawFlow()
        }
      ];

      return (
        <ReactFlowProvider>
          <div style={{ height: '100%', flexGrow: 1 }}>
            <ReactFlow
              elements={flow}
              nodeTypes={{ tier: CustomNode }}
              onConnect={({ source, target }) => {
                const indexChild = data?.findIndex(
                  item => item?.tier?.name === target
                );
                const child = { ...data[indexChild] };
                child.tier.parents = [...(child?.tier?.parents ?? []), source];

                handleEdit(indexChild);
                handleSave(child);
                setFlow(prevFlow =>
                  addEdge({ source, target, animated: true }, prevFlow)
                );
              }}
              onLoad={reactFlowInstance => {
                reDrawFlow();
                reactFlowInstance.fitView();
              }}
            >
              <SpeedDials actions={actions} />
              <Background color="#aaa" gap={16} />
            </ReactFlow>
          </div>
          {showDialog && (
            <Context.Provider value={{ nestedForm }}>
              <DialogForm
                open={showDialog}
                title={'Tier form'}
                resolver={resolvers}
                values={editingData.data}
                onCancel={() => setShowDialog(false)}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                  <FormStepper
                    steps={steps}
                    initialValue={editingData.data}
                    onSubmit={values => {
                      handleSave(values);
                      setShowDialog(false);
                      reDrawFlow();
                    }}
                  />
                </div>
              </DialogForm>
            </Context.Provider>
          )}
        </ReactFlowProvider>
      );
    }, [])
  };
};

export default Tiers;
