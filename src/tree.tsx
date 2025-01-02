import PageLayout from '@/components/core/PageLayout';
import { createTreeCollection } from '@ark-ui/react';
import { Gear } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useParams } from 'react-router-dom';
import MainNavMenu from '../components/MainNavMenu';
import Breadcrumb from '../components/core/Breadcrumbs';
import Button from '../components/core/Button';
import ContextMenu from '../components/core/ContextMenu';
import { Input } from '../components/core/Input';
import { Label } from '../components/core/Label';
import Select from '../components/core/Select';
import { FieldNode, GroupNode, ListNode, SchemaNode } from './Schema.model';
import { SchemaTree } from './SchemaTreeViewer';
import { schemaExample } from './old-code';
import { createNewNode, deleteFieldById, generateUniqueName } from './utils';

const SchemaBuilderBreadcrumb = () => {
  const { workspace } = useParams<{ workspace: string }>();
  return (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <MainNavMenu workspace={workspace} />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Gear weight="duotone" />
          Settings: Extract
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>Schema</Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
};

type EditNodeProps = {
  indexPath: number[];
  nodeToEdit: SchemaNode;
  onSave: (indexPath: number[], node: SchemaNode) => void;
};

const EditNodePanel: React.FC<EditNodeProps> = ({ indexPath, nodeToEdit, onSave }) => {
  const [node, setNode] = useState(nodeToEdit);

  useEffect(() => {
    setNode(nodeToEdit);
  }, [nodeToEdit]);

  return (
    <Panel id="editingnode" defaultSize={20} order={2} className="bg-base-3 h-full flex flex-col">
      <div className="p-2 grid gap-2 border-b-2 border-base-5">Editing Node</div>
      <div className="p-2 grid gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={node.name}
            onChange={e => setNode(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="nodeType">Node Type</Label>
          <Select.Root
            value={(node as FieldNode).type}
            onValueChange={newType => {
              setNode(prev => {
                if (newType === 'field') {
                  return { ...prev, type: newType, fieldType: 'string' } as FieldNode;
                } else {
                  return { ...prev, type: newType, children: [] } as GroupNode | ListNode;
                }
              });
            }}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="group">Group</Select.Item>
              <Select.Item value="list">List</Select.Item>
              <Select.Item value="field">Field</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        {node.type === 'field' && (
          <div>
            <Label htmlFor="fieldType">Field Type</Label>
            <Select.Root
              value={(node as FieldNode).fieldType}
              onValueChange={newValue => {
                setNode(
                  prev =>
                    ({
                      ...prev,
                      fieldType: newValue,
                    } as FieldNode),
                );
              }}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="string">String</Select.Item>
                <Select.Item value="date">Date</Select.Item>
                <Select.Item value="number">Number</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        )}

        <Button onClick={() => onSave(indexPath, node)}>Save</Button>
      </div>
    </Panel>
  );
};

const SchemaBuilderPage = () => {
  const [schema, setSchema] = useState(
    createTreeCollection<SchemaNode>({
      nodeToValue: node => node.id,
      nodeToString: node => node.name,
      rootNode: {
        id: 'root',
        name: 'Root',
        type: 'group',
        children: schemaExample.children,
      },
    }),
  );
  const [editingNode, setEditingNode] = useState<{ indexPath: number[]; node: SchemaNode } | null>(
    null,
  );

  const onAddNodeAtRoot = () => {
    setSchema(prevSchema => {
      let newIndexPath = [(prevSchema.rootNode as GroupNode).children.length];
      const newNode = createNewNode('New Node', 'new_node', prevSchema.rootNode as GroupNode);
      const updatedRootNode = prevSchema.insertAfter(newIndexPath, newNode);
      return createTreeCollection<SchemaNode>({
        nodeToValue: node => node.id,
        nodeToString: node => node.name,
        rootNode: updatedRootNode,
      });
    });
  };

  const onAddNodeBefore = (node: SchemaNode) => {
    setSchema(prevSchema => {
      console.log('originalRootNode', prevSchema.rootNode);
      let updatedRootNode = prevSchema.rootNode;
      const newIndexPath = prevSchema.getIndexPath(node.id);
      const parentNode = prevSchema.getParentNode(node.id);
      if (parentNode.type === 'list' || parentNode.type === 'group') {
        const newNode = createNewNode('New Node', 'new_node', parentNode);
        updatedRootNode = prevSchema.insertBefore(newIndexPath, newNode);
      }
      console.log('updatedRootNode', updatedRootNode);
      return createTreeCollection<SchemaNode>({
        nodeToValue: node => node.id,
        nodeToString: node => node.name,
        rootNode: updatedRootNode,
      });
    });
  };

  const onAddNodeAfter = (node: SchemaNode) => {
    setSchema(prevSchema => {
      let updatedRootNode = prevSchema.rootNode;
      const newIndexPath = prevSchema.getIndexPath(node.id);
      const parentNode = prevSchema.getParentNode(node.id);
      if (parentNode.type === 'list' || parentNode.type === 'group') {
        const newNode = createNewNode('New Node', 'new_node', parentNode);
        updatedRootNode = prevSchema.insertAfter(newIndexPath, newNode);
      }
      return createTreeCollection<SchemaNode>({
        nodeToValue: node => node.id,
        nodeToString: node => node.name,
        rootNode: updatedRootNode,
      });
    });
  };

  const onAddNodeWithin = (node: ListNode | GroupNode, newIndexPath: number[]) => {
    setSchema(prevSchema => {
      const newNode = createNewNode('New Node', 'new_node', node);
      const updatedRootNode = prevSchema.insertAfter(
        [...newIndexPath, node.children.length],
        newNode,
      );
      return createTreeCollection<SchemaNode>({
        nodeToValue: node => node.id,
        nodeToString: node => node.name,
        rootNode: updatedRootNode,
      });
    });
  };

  const onDeleteNode = (node: SchemaNode) => {
    setSchema(prevSchema => {
      const updatedRootNode = deleteFieldById(prevSchema.rootNode, node.id);
      return createTreeCollection<SchemaNode>({
        nodeToValue: node => node.id,
        nodeToString: node => node.name,
        rootNode: updatedRootNode,
      });
    });
  };

  const onSave = (indexPath: number[], editedNode: SchemaNode) => {
    setSchema(prevSchema => {
      // ensure unique name
      editedNode.name = generateUniqueName(
        editedNode.name,
        editedNode.id,
        schema.getParentNode(editedNode.id) as GroupNode | ListNode,
      );

      const updatedRootNode = prevSchema.replace(indexPath, editedNode);
      return createTreeCollection<SchemaNode>({
        nodeToValue: node => node.id,
        nodeToString: node => node.name,
        rootNode: updatedRootNode,
      });
    });
    setEditingNode(null);
  };

  // TODO remove
  useEffect(() => {
    console.log('rootNode', schema.rootNode);
  }, [schema.rootNode]);

  return (
    <PageLayout.Root>
      <PageLayout.Header className="justify-between">
        <SchemaBuilderBreadcrumb />
        <Button affordance="secondary" onClick={onAddNodeAtRoot}>
          New
        </Button>
      </PageLayout.Header>
      <PageLayout.Content>
        <PanelGroup direction="horizontal">
          <Panel id="tree" order={1}>
            <SchemaTree
              collection={schema}
              RightClickMenu={({ children, node, indexPath }) => (
                <ContextMenu.Root>
                  <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
                  <ContextMenu.Content>
                    <ContextMenu.Item inset onSelect={() => setEditingNode({ indexPath, node })}>
                      Select (Edit)
                    </ContextMenu.Item>
                    <ContextMenu.Item inset onSelect={() => onDeleteNode(node)}>
                      Delete
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Label inset>Add Element</ContextMenu.Label>
                    <ContextMenu.Item inset onSelect={() => onAddNodeBefore(node)}>
                      Above
                    </ContextMenu.Item>
                    {(node.type === 'group' || node.type === 'list') && (
                      <ContextMenu.Item inset onSelect={() => onAddNodeWithin(node, indexPath)}>
                        Within
                      </ContextMenu.Item>
                    )}
                    <ContextMenu.Item inset onSelect={() => onAddNodeAfter(node)}>
                      Below
                    </ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu.Root>
              )}
            />
          </Panel>

          {editingNode && (
            <EditNodePanel
              indexPath={editingNode.indexPath}
              nodeToEdit={editingNode.node}
              onSave={onSave}
            />
          )}
          <PanelResizeHandle className="w-6" />
        </PanelGroup>
      </PageLayout.Content>
    </PageLayout.Root>
  );
};

export default SchemaBuilderPage;