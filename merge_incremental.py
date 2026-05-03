import json
from pathlib import Path

# Load previous extraction from persistent graph
previous = json.loads(Path('graphify-out/graph.json').read_text())
prev_nodes = {n['id']: n for n in previous.get('nodes', [])}
prev_edges = {(e['source'], e['target'], e['relation']): e for e in previous.get('edges', [])}

# Load incremental extraction
incremental = json.loads(Path('.graphify_ast_incremental.json').read_text())
inc_nodes = {n['id']: n for n in incremental.get('nodes', [])}
inc_edges = {(e['source'], e['target'], e['relation']): e for e in incremental.get('edges', [])}

# Merge nodes: previous + new
merged_nodes_dict = {**prev_nodes, **inc_nodes}

# Merge edges: previous + new (deduplicate by source+target+relation)
merged_edges_dict = {**prev_edges, **inc_edges}

# Convert back to lists
merged = {
    'nodes': list(merged_nodes_dict.values()),
    'edges': list(merged_edges_dict.values()),
    'input_tokens': previous.get('input_tokens', 0) + incremental.get('input_tokens', 0),
    'output_tokens': previous.get('output_tokens', 0) + incremental.get('output_tokens', 0),
}

Path('.graphify_extract.json').write_text(json.dumps(merged, indent=2), encoding='utf-8')

print(f'Merged: {len(merged["nodes"])} nodes ({len(prev_nodes)} prev + {len(inc_nodes)} new)')
print(f'Merged: {len(merged["edges"])} edges ({len(prev_edges)} prev + {len(inc_edges)} new)')
print(f'Token cost: {merged["input_tokens"]} input, {merged["output_tokens"]} output')
