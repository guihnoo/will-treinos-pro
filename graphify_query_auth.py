import json
import sys
import networkx as nx
from networkx.readwrite import json_graph
from pathlib import Path

# Load graph
data = json.loads(Path('graphify-out/graph.json').read_text())
G = json_graph.node_link_graph(data, edges='links')

question = "Auth flow, RLS security, data isolation, OAuth token handling"
terms = [t.lower() for t in ['auth', 'rls', 'security', 'data', 'isolation', 'oauth', 'token']]

# Find best-matching start nodes
scored = []
for nid, ndata in G.nodes(data=True):
    label = ndata.get('label', '').lower()
    score = sum(1 for t in terms if t in label)
    if score > 0:
        scored.append((score, nid, ndata.get('label', nid)))

scored.sort(reverse=True)
start_nodes = [nid for _, nid, _ in scored[:5]]

print(f'Query: {question}')
print(f'Starting nodes: {[label for _, _, label in scored[:5]]}')
print(f'Terms matched: {terms}\n')

# BFS: explore all neighbors layer by layer up to depth 3
frontier = set(start_nodes)
subgraph_nodes = set(start_nodes)
subgraph_edges = []

for depth in range(3):
    next_frontier = set()
    for n in frontier:
        for neighbor in G.neighbors(n):
            if neighbor not in subgraph_nodes:
                next_frontier.add(neighbor)
                subgraph_edges.append((n, neighbor))
    subgraph_nodes.update(next_frontier)
    frontier = next_frontier

# Score each node by term overlap
def relevance(nid):
    label = G.nodes[nid].get('label', '').lower()
    return sum(1 for t in terms if t in label)

ranked_nodes = sorted(subgraph_nodes, key=relevance, reverse=True)

print(f'Subgraph: {len(subgraph_nodes)} nodes, {len(subgraph_edges)} edges\n')
print('=' * 80)
print('NODES IN SECURITY/AUTH CONTEXT:\n')

for nid in ranked_nodes[:20]:  # Top 20 most relevant
    d = G.nodes[nid]
    label = d.get('label', nid)
    src_file = d.get('source_file', 'unknown')
    file_type = d.get('file_type', 'unknown')
    rel_score = relevance(nid)
    print(f'  [{rel_score}] {label}')
    print(f'      File: {src_file} ({file_type})')
    print()

print('=' * 80)
print('\nKEY EDGES (Security/Auth Relationships):\n')

# Filter edges to only show those between relevant nodes
key_edges = []
for u, v in subgraph_edges:
    if u in ranked_nodes[:20] or v in ranked_nodes[:20]:
        edge_data = G.edges[u, v]
        key_edges.append((u, v, edge_data))

for u, v, edge_data in key_edges[:30]:  # Top 30 edges
    u_label = G.nodes[u].get('label', u)
    v_label = G.nodes[v].get('label', v)
    relation = edge_data.get('relation', 'unknown')
    confidence = edge_data.get('confidence', 'unknown')

    print(f'  {u_label}')
    print(f'    --[{relation}]--> [{confidence}]')
    print(f'    {v_label}\n')
