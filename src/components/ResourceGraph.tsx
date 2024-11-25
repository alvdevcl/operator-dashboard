import React, { useCallback } from 'react';
import ReactFlow, { 
  Node,
  Edge,
  Background,
  Controls,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Box, Shield, Database, Globe, Cog, X } from 'lucide-react';
import type { CustomResource } from '../types/k8s';

interface ResourceGraphProps {
  resource: CustomResource;
  onNodeClick: (nodeId: string) => void;
  onClose?: () => void;
}

const nodeWidth = 250;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const CustomNode = ({ data }: { data: any }) => {
  const Icon = data.icon;
  return (
    <div className={`px-4 py-2 shadow-lg rounded-lg border ${data.selected ? 'border-primary' : 'border-border'} bg-background`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${data.iconColor}`} />
        <div>
          <p className="text-sm font-medium">{data.label}</p>
          <p className="text-xs text-muted-foreground">{data.sublabel}</p>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

function ResourceGraphInner({ resource, onNodeClick, onClose }: ResourceGraphProps) {
  const [layout, setLayout] = React.useState<'TB' | 'LR'>('TB');

  const initialNodes: Node[] = [
    {
      id: 'main',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: {
        label: resource.kind,
        sublabel: resource.metadata.name,
        icon: Database,
        iconColor: 'text-primary',
      },
    },
    {
      id: 'deployment',
      type: 'custom',
      position: { x: 0, y: 100 },
      data: {
        label: 'Deployment',
        sublabel: `${resource.metadata.name}-deployment`,
        icon: Box,
        iconColor: 'text-blue-500',
      },
    },
    {
      id: 'service',
      type: 'custom',
      position: { x: -200, y: 200 },
      data: {
        label: 'Service',
        sublabel: `${resource.metadata.name}-service`,
        icon: Globe,
        iconColor: 'text-green-500',
      },
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: 'main-deployment',
      source: 'main',
      target: 'deployment',
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    },
    {
      id: 'deployment-service',
      source: 'deployment',
      target: 'service',
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    },
  ];

  if (resource.spec.ingress?.enabled) {
    initialNodes.push({
      id: 'ingress',
      type: 'custom',
      position: { x: 200, y: 200 },
      data: {
        label: 'Ingress',
        sublabel: `${resource.metadata.name}-ingress`,
        icon: Globe,
        iconColor: 'text-orange-500',
      },
    });

    initialEdges.push({
      id: 'service-ingress',
      source: 'service',
      target: 'ingress',
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    });
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges,
    layout
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onLayout = useCallback((direction: 'TB' | 'LR') => {
    setLayout(direction);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      direction
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [initialNodes, initialEdges]);

  return (
    <div className="h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg border relative">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => onLayout('TB')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
            layout === 'TB' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Vertical Layout
        </button>
        <button
          onClick={() => onLayout('LR')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
            layout === 'LR' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Horizontal Layout
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5
        }}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={12} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function ResourceGraph(props: ResourceGraphProps) {
  return (
    <ReactFlowProvider>
      <ResourceGraphInner {...props} />
    </ReactFlowProvider>
  );
}