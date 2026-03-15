import React, { useEffect, useMemo, useState } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  BaseEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '../../lib/utils/cn';
import { Loader2 } from 'lucide-react';
import type { OrgChartNode, Employee, Department, DepartmentInfo } from './types';
import EmployeeCard from './EmployeeCard';
import Tooltip from '../ui/Tooltip';

interface OrgChartViewProps {
  orgChart: OrgChartNode | null;
  selectedDepartment?: Department;
  selectedDepartmentId?: string;
  isEditMode?: boolean;
  departmentButtons?: DepartmentInfo[];
  departmentColors?: Record<string, { bg: string; }>;
  onViewProfile?: (employee: Employee) => void;
  onSendEmail?: (employee: Employee) => void;
  onCall?: (employee: Employee) => void;
  onSendMessage?: (employee: Employee) => void;
  onViewSOP?: (employee: Employee) => void;
  onAdd?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onDepartmentFilter?: (deptId: string) => void;
  onEditModeChange?: (isEdit: boolean) => void;
  onSave?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}



type ElkEdge = ElkExtendedEdge;
type ElkNodeLayout = ElkNode;
type ElkLayout = ElkNode;
type ElkGraphInput = ElkLayout & { layoutOptions: Record<string, string> };

const CARD_WIDTH = 278;
const CARD_HEIGHT = 180;
const DEPT_WIDTH = 278;
const DEPT_HEIGHT = 60;

// Custom node data type
interface EmployeeNodeData extends Record<string, unknown> {
  employee: Employee;
  isEditMode: boolean;
  onViewProfile?: (employee: Employee) => void;
  onSendEmail?: (employee: Employee) => void;
  onCall?: (employee: Employee) => void;
  onSendMessage?: (employee: Employee) => void;
  onViewSOP?: (employee: Employee) => void;
  onAdd?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

// Department Node Component (minimal box for the root)
const DepartmentNode: React.FC<{ data: EmployeeNodeData }> = ({ data }) => {
  return (
    <div className="relative">
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        style={{
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: '1px',
          background: 'transparent',
          border: 'none',
        }}
      />
      <div className="flex flex-col items-center justify-center bg-white border border-[#E6E6E6] rounded-lg p-4 w-[278px]">
        <h2 className="text-md font-bold text-gray-700 uppercase">{data.employee.name}</h2>
      </div>
    </div>
  );
};

// Custom Employee Node Component
const EmployeeNode: React.FC<{ data: EmployeeNodeData }> = ({ data }) => {
  return (
    <div className="relative">
      {/* Source handle at bottom center */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        style={{
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: '1px',
          background: 'transparent',
          border: 'none',
        }}
      />
      {/* Target handle at top center */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        style={{
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: '1px',
          background: 'transparent',
          border: 'none',
        }}
      />
      <EmployeeCard
        employee={data.employee}
        variant="org-chart"
        showActions={!data.isEditMode}
        showAddDelete={data.isEditMode}
        onViewProfile={data.onViewProfile}
        onSendEmail={data.onSendEmail}
        onCall={data.onCall}
        onSendMessage={data.onSendMessage}
        onViewSOP={data.onViewSOP}
        onAdd={data.onAdd}
        onDelete={data.onDelete}
      />
    </div>
  );
};

// Generate an orthogonal path that only rounds the outer elbow (near the child)
// while keeping the junction corner square. Assumes vertical flow (parent above child).
const buildOrthogonalPath = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  borderRadius,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  borderRadius: number;
}) => {
  // Midline where the horizontal bus runs; mimics smooth-step behavior
  const midY = sourceY + (targetY - sourceY) / 2;

  // Determine rounding only for the second corner (outer elbow)
  const dx = targetX - sourceX;
  const dy = targetY - midY;
  const signX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const signY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  // Limit radius so it fits within the available run lengths
  const maxRadius = Math.min(
    Math.abs(dx) / 2,
    Math.abs(dy) / 2,
    borderRadius
  );
  const r2 = maxRadius > 0 ? maxRadius : 0;

  const p0 = `M ${sourceX},${sourceY}`;
  const p1 = `L ${sourceX},${midY}`; // vertical down from parent

  // First corner (junction) stays sharp
  const p2 = `L ${targetX},${midY}`;

  if (r2 === 0 || signX === 0 || signY === 0) {
    // No rounding possible; straight to target
    return `${p0} ${p1} ${p2} L ${targetX},${targetY}`;
  }

  // Pull back before the outer corner, round it, then drop to the child
  const beforeCorner = `L ${targetX - signX * r2},${midY}`;
  const roundedCorner = `Q ${targetX},${midY} ${targetX},${midY + signY * r2}`;
  const toTarget = `L ${targetX},${targetY}`;

  return `${p0} ${p1} ${beforeCorner} ${roundedCorner} ${toTarget}`;
};

// Custom Edge with 90-degree connections, selective rounded corners,
// and endpoint markers
const CustomSmoothStepEdge: React.FC<{
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: { borderRadius?: number };
  style?: React.CSSProperties;
}> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}) => {
    // Use borderRadius from data if provided, default to 10 for backward compatibility
    const borderRadius = data?.borderRadius ?? 10;
    const markerRadius = 3.5;
    const markerColor = '#008080';

    const edgePath = buildOrthogonalPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      borderRadius,
    });

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: '#E6E6E6',
            strokeWidth: 2,
            zIndex: 10,
            pointerEvents: 'none',
            ...style,
          }}
        />
        {/* Endpoint markers */}
        <circle
          cx={sourceX}
          cy={sourceY}
          r={markerRadius}
          fill={markerColor}
          style={{ pointerEvents: 'none', zIndex: 20 }}
        />
        <circle
          cx={targetX}
          cy={targetY}
          r={markerRadius}
          fill={markerColor}
          style={{ pointerEvents: 'none', zIndex: 20 }}
        />
      </>
    );
  };

const nodeTypes: NodeTypes = {
  employee: EmployeeNode,
  department: DepartmentNode,
};

const edgeTypes: EdgeTypes = {
  default: CustomSmoothStepEdge,
};

interface FlowContentProps {
  nodes: Node<EmployeeNodeData>[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onViewportReady: () => void;
  loading: boolean;
  isComputingLayout: boolean;
  hasLayout: boolean;
}

const FlowContent: React.FC<FlowContentProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onViewportReady,
  loading,
  isComputingLayout,
  hasLayout,
}) => {
  const { fitView } = useReactFlow();
  const [hasCentered, setHasCentered] = useState(false);

  // Trigger fitView once nodes are ready
  useEffect(() => {
    if (nodes.length > 0 && hasLayout && !hasCentered) {
      // Small timeout to ensure React Flow has rendered the nodes
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 0, minZoom: 0.7, maxZoom: 1 });
        setHasCentered(true);
        onViewportReady();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodes, hasLayout, hasCentered, fitView, onViewportReady]);

  // Reset centering if metadata changes significantly
  useEffect(() => {
    if (loading || isComputingLayout) {
      setHasCentered(false);
    }
  }, [loading, isComputingLayout]);

  return (
    <ReactFlow
      className="org-chart-flow"
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
      minZoom={0.2}
      maxZoom={4}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      panOnDrag={true}
      zoomOnScroll={true}
      zoomOnPinch={true}
      preventScrolling={false}
      style={{
        background: 'transparent',
      }}
    >
      <style>{`
      /* Keep edges above cards so endpoint dots stay visible */
      .org-chart-flow .react-flow__edges {
        z-index: 3;
      }
      .org-chart-flow .react-flow__nodes {
        z-index: 2;
      }
      .react-flow__edge-path {
        stroke: #CBD3D5;
        stroke-width: 1.6;
      }
      .react-flow__handle {
        width: 0;
        height: 0;
        border: none;
        background: transparent;
      }
    `}</style>
    </ReactFlow>
  );
};

const OrgChartView: React.FC<OrgChartViewProps> = ({
  orgChart,
  selectedDepartment,
  selectedDepartmentId,
  isEditMode = false,
  departmentButtons = [],
  departmentColors = {},
  onViewProfile,
  onSendEmail,
  onCall,
  onSendMessage,
  onViewSOP,
  onAdd,
  onDelete,
  onDepartmentFilter,
  onEditModeChange,
  onSave,
  onCancel,
  loading = false,
}) => {
  const elk = useMemo(() => new ELK(), []);
  const [internalNodes, setInternalNodes, onNodesChange] = useNodesState<Node<EmployeeNodeData>>([]);
  const [internalEdges, setInternalEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [isComputingLayout, setIsComputingLayout] = useState(false);
  const [layoutState, setLayoutState] = useState<{ graph: ElkLayout, nodeMap: Map<string, OrgChartNode> } | null>(null);
  const [layoutFailed, setLayoutFailed] = useState(false);
  const [isViewportReady, setIsViewportReady] = useState(false);

  // Recursively build ELK graph from orgChart
  const fullOrgChart = useMemo(() => orgChart, [orgChart]);

  // Reset viewport ready state when loading starts or layout is recomputed
  useEffect(() => {
    if (loading || isComputingLayout) {
      setIsViewportReady(false);
    }
  }, [loading, isComputingLayout]);

  useEffect(() => {
    if (!fullOrgChart) {
      setLayoutState(null);
      return;
    }

    const nodeMap = new Map<string, OrgChartNode>();
    const elkNodes: ElkNodeLayout[] = [];
    const elkEdges: ElkEdge[] = [];

    let edgeCounter = 0;
    const visit = (node: OrgChartNode) => {
      nodeMap.set(node.employee.id, node);
      const isDept = (node.employee as any).isDepartment === true;
      elkNodes.push({
        id: node.employee.id,
        width: isDept ? DEPT_WIDTH : CARD_WIDTH,
        height: isDept ? DEPT_HEIGHT : CARD_HEIGHT,
      });

      node.children?.forEach((child) => {
        elkEdges.push({
          id: `edge-${node.employee.id}-${child.employee.id}-${edgeCounter++}`,
          sources: [node.employee.id],
          targets: [child.employee.id],
        });
        visit(child);
      });
    };

    visit(fullOrgChart);

    const graph: ElkGraphInput = {
      id: 'org-chart',
      children: elkNodes,
      edges: elkEdges,
      layoutOptions: {
        'elk.algorithm': 'mrtree',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '40',
        'elk.spacing.edgeEdge': '20',
        'elk.padding': '40',
        'elk.tree.nodeNodeSpacing': '40',
        'elk.tree.levelSpacing': '100',
      },
    };

    let cancelled = false;
    const runLayout = async () => {
      try {
        setIsComputingLayout(true);
        setLayoutFailed(false);
        const result = await elk.layout(graph);
        if (!cancelled) {
          setLayoutState({ graph: result, nodeMap });
        }
      } catch (error) {
        console.error('Failed to layout organization chart', error);
        if (!cancelled) {
          setLayoutState(null); // Layout failed
          setLayoutFailed(true);
        }
      } finally {
        if (!cancelled) {
          setIsComputingLayout(false);
        }
      }
    };

    runLayout();
    return () => {
      cancelled = true;
    };
  }, [elk, fullOrgChart]);

  // Convert elkjs layout to React Flow nodes and edges
  useEffect(() => {
    if (!layoutState?.graph.children) {
      setInternalNodes([]);
      setInternalEdges([]);
      return;
    }

    const visibleIds = new Set<string>();

    // First pass: collect all nodes and filter by department
    const allNodes: Node<EmployeeNodeData>[] = [];

    layoutState.graph.children.forEach((layoutNode) => {
      const node = layoutState.nodeMap.get(layoutNode.id);
      if (!node || layoutNode.x === undefined || layoutNode.y === undefined) return;

      // Filter by department if selected
      if (selectedDepartment && node.employee.department !== selectedDepartment) {
        return;
      }

      visibleIds.add(layoutNode.id);

      allNodes.push({
        id: layoutNode.id,
        type: (node.employee as any).isDepartment ? 'department' : 'employee',
        position: { x: layoutNode.x, y: layoutNode.y },
        data: {
          employee: node.employee,
          isEditMode,
          onViewProfile,
          onSendEmail,
          onCall,
          onSendMessage,
          onViewSOP,
          onAdd,
          onDelete,
        },
      });
    });

    // Second pass: create edges only for visible nodes
    const edgesByParent = new Map<string, Array<{ edge: ElkEdge; targetId: string }>>();

    if (layoutState.graph.edges) {
      layoutState.graph.edges.forEach((edge) => {
        const sourceId = edge.sources?.[0];
        const targetId = edge.targets?.[0];
        if (sourceId && targetId && visibleIds.has(sourceId) && visibleIds.has(targetId)) {
          if (!edgesByParent.has(sourceId)) {
            edgesByParent.set(sourceId, []);
          }
          edgesByParent.get(sourceId)!.push({ edge, targetId });
        }
      });
    }

    const nodePositionMap = new Map<string, { x: number; y: number }>();
    layoutState.graph.children?.forEach((child) => {
      if (child.x !== undefined && child.y !== undefined) {
        nodePositionMap.set(child.id, { x: child.x, y: child.y });
      }
    });

    const allEdges: Edge[] = [];

    edgesByParent.forEach((children, parentId) => {
      const sortedChildren = [...children].sort((a, b) => {
        const posA = nodePositionMap.get(a.targetId);
        const posB = nodePositionMap.get(b.targetId);
        if (!posA || !posB) return 0;
        return posA.x - posB.x;
      });

      const leftmostId = sortedChildren.length > 0 ? sortedChildren[0].targetId : null;
      const rightmostId = sortedChildren.length > 1 ? sortedChildren[sortedChildren.length - 1].targetId : leftmostId;

      children.forEach(({ edge, targetId }) => {
        const isLeftmostOrRightmost = targetId === leftmostId || targetId === rightmostId;
        const borderRadius = isLeftmostOrRightmost ? 10 : 0;

        allEdges.push({
          id: edge.id,
          source: parentId,
          target: targetId,
          sourceHandle: 'source-bottom',
          targetHandle: 'target-top',
          type: 'default',
          data: { borderRadius },
        });
      });
    });

    setInternalNodes(allNodes);
    setInternalEdges(allEdges);
  }, [layoutState, selectedDepartment, isEditMode, onViewProfile, onSendEmail, onCall, onSendMessage, onViewSOP, onAdd, onDelete, setInternalNodes, setInternalEdges]);

  if (!fullOrgChart && !loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (layoutFailed) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        Failed to compute chart layout. The organization structure may be too complex.
      </div>
    );
  }

  const showLoader = loading || isComputingLayout || !layoutState || !isViewportReady;

  return (
    <div className="relative flex flex-col h-full bg-white rounded-[10px]" style={{
      backgroundImage: 'radial-gradient(circle, rgb(38 38 39 / 5%) 5px, transparent 5px)',
      backgroundSize: '50px 50px',
    }}>
      {isEditMode ? (
        <div className={cn(
          'mb-4 flex items-center justify-between ps-5 pe-2.5 py-[12px] rounded-t-lg transition',
          'bg-[#1C2745]'
        )}>
          <span className="text-lg font-semibold leading-normal text-white">
            {selectedDepartmentId
              ? departmentButtons.find(dept => dept.id === selectedDepartmentId)?.name || 'Edit Mode'
              : selectedDepartment || 'Edit Mode'}
          </span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onCancel}
              className="w-[130px] h-[37px] bg-white text-gray-700 rounded-[25px] text-sm font-semibold hover:bg-gray-50 transition cursor-pointer flex items-center justify-center gap-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="w-[130px] h-[37px] bg-[#16A34A] text-white rounded-[25px] text-sm font-semibold hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-2.5 right-2.5 z-10">
            <Tooltip content="Edit Structure" side="left">
              <button
                type="button"
                onClick={() => onEditModeChange?.(true)}
                className="w-9 h-9 bg-[#1C2745] text-white rounded-[25px] text-sm font-semibold hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M2 5.8856C2 4.85507 2.40937 3.86676 3.13807 3.13807C3.86676 2.40937 4.85507 2 5.8856 2H10C10.2122 2 10.4157 2.08429 10.5657 2.23431C10.7157 2.38434 10.8 2.58783 10.8 2.8C10.8 3.01217 10.7157 3.21566 10.5657 3.36569C10.4157 3.51571 10.2122 3.6 10 3.6H5.8856C5.27942 3.6 4.69807 3.8408 4.26944 4.26944C3.8408 4.69807 3.6 5.27942 3.6 5.8856V14.1144C3.6 14.7206 3.8408 15.3019 4.26944 15.7306C4.69807 16.1592 5.27942 16.4 5.8856 16.4H14.1144C14.7206 16.4 15.3019 16.1592 15.7306 15.7306C16.1592 15.3019 16.4 14.7206 16.4 14.1144V10C16.4 9.78783 16.4843 9.58434 16.6343 9.43431C16.7843 9.28429 16.9878 9.2 17.2 9.2C17.4122 9.2 17.6157 9.28429 17.7657 9.43431C17.9157 9.58434 18 9.78783 18 10V14.1144C18 15.1449 17.5906 16.1332 16.8619 16.8619C16.1332 17.5906 15.1449 18 14.1144 18H5.8856C4.85507 18 3.86676 17.5906 3.13807 16.8619C2.40937 16.1332 2 15.1449 2 14.1144V5.8856Z" fill="white" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.5097 10.9751L10.7457 12.0391L9.91927 10.6687L11.6833 9.60469L11.6857 9.60309C11.7533 9.56237 11.8156 9.51346 11.8713 9.45749L15.8793 5.42869C15.9194 5.38821 15.9581 5.34632 15.9953 5.30309C16.2601 4.99429 16.6521 4.38309 16.1777 3.90629C15.7769 3.50309 15.2025 3.88389 14.8305 4.21109C14.7307 4.29906 14.6346 4.39114 14.5425 4.48709L14.5153 4.51429L10.5633 8.48629C10.4694 8.57957 10.3959 8.69124 10.3473 8.81429L9.68807 10.4727C9.67556 10.5039 9.67321 10.5382 9.68133 10.5709C9.68946 10.6035 9.70765 10.6327 9.73333 10.6544C9.75901 10.6761 9.79087 10.6892 9.82439 10.6917C9.85791 10.6943 9.89059 10.6862 9.91927 10.6687L10.7457 12.0391C9.30167 12.9095 7.57767 11.4471 8.20167 9.88069L8.86167 8.22309C8.99016 7.89917 9.18344 7.60489 9.42967 7.35829L13.3809 3.38549L13.4041 3.36229C13.5217 3.24229 13.9169 2.83749 14.3961 2.54629C14.6577 2.38869 15.0753 2.17989 15.5913 2.13989C16.1833 2.09269 16.8153 2.27909 17.3113 2.77749C17.6909 3.15252 17.9297 3.64696 17.9873 4.17749C18.0269 4.591 17.9637 5.0079 17.8033 5.39109C17.5713 5.96469 17.1841 6.38629 17.0137 6.55669L13.0057 10.5855C12.8563 10.7354 12.691 10.8652 12.5097 10.9751ZM16.0721 5.27429C16.0721 5.27429 16.0689 5.27669 16.0617 5.27909L16.0721 5.27429Z" fill="white" />
                </svg>
              </button>
            </Tooltip>
          </div>
          <div className="my-5 flex items-center justify-center gap-[25px] flex-wrap">
            {loading && departmentButtons.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={`skeleton-btn-${i}`} className="px-[15px] py-[10px] w-24 h-9 bg-gray-100 animate-pulse rounded-[10px] shadow-[0_2px_4px_0_rgba(0,0,0,0.10)]" />
              ))
            ) : (
              departmentButtons.map((dept) => {
                const deptName = dept.name as Department;
                const colors = departmentColors[deptName] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                const isSelected = selectedDepartmentId === dept.id;
                return (
                  <div key={dept.id} className="relative">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onDepartmentFilter?.(dept.id)}
                      className={cn(
                        'px-[15px] py-[10px] rounded-[10px] text-sm font-semibold transition cursor-pointer shadow-[0_2px_4px_0_rgba(0,0,0,0.10)] flex items-center gap-2',
                        `${colors.bg}`
                      )}
                    >
                      {loading && isSelected && <Loader2 className="w-4 h-4 animate-spin" />}
                      {dept.name}
                    </button>
                    {isSelected && <div className="absolute -top-[4px] -left-[4px] border-2 border-[#CACACA] rounded-[14px] w-[calc(100%+8px)] h-[calc(100%+8px)]" />}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <div className="flex-1 relative w-full overflow-hidden">
        {showLoader && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-transparent transition-opacity duration-300">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}
        <div className={cn(
          "w-full h-full transition-opacity duration-300",
          showLoader ? "opacity-0" : "opacity-100"
        )}>
          <FlowContent
            nodes={internalNodes}
            edges={internalEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onViewportReady={() => setIsViewportReady(true)}
            loading={loading}
            isComputingLayout={isComputingLayout}
            hasLayout={!!layoutState}
          />
        </div>
      </div>
    </div>
  );
};

// Wrap with Provider for useReactFlow
const OrgChartViewWrapper: React.FC<OrgChartViewProps> = (props) => (
  <ReactFlowProvider>
    <OrgChartView {...props} />
  </ReactFlowProvider>
);

export default OrgChartViewWrapper;
