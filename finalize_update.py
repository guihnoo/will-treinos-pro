import json
from pathlib import Path
from datetime import datetime, timezone

# Update cost tracker with incremental run
extract = json.loads(Path('.graphify_extract.json').read_text())
input_tok = extract.get('input_tokens', 0)
output_tok = extract.get('output_tokens', 0)

cost_path = Path('graphify-out/cost.json')
if cost_path.exists():
    cost = json.loads(cost_path.read_text())
else:
    cost = {'runs': [], 'total_input_tokens': 0, 'total_output_tokens': 0}

detect = json.loads(Path('.graphify_detect_incremental.json').read_text())
cost['runs'].append({
    'date': datetime.now(timezone.utc).isoformat(),
    'input_tokens': input_tok,
    'output_tokens': output_tok,
    'files': detect.get('total_files', 0),
    'type': 'incremental',
})
cost['total_input_tokens'] += input_tok
cost['total_output_tokens'] += output_tok
cost_path.write_text(json.dumps(cost, indent=2), encoding='utf-8')

print(f'This run: {input_tok:,} input tokens, {output_tok:,} output tokens')
print(f'All time: {cost["total_input_tokens"]:,} input, {cost["total_output_tokens"]:,} output ({len(cost["runs"])} runs)')

# Clean up temp files
temp_files = [
    '.graphify_detect_incremental.json',
    '.graphify_ast_incremental.json',
    '.graphify_analysis.json',
    '.graphify_labels.json',
]
for f in temp_files:
    try:
        Path(f).unlink()
    except:
        pass

print('\nGraphify incremental update complete!')

# Summary
extract = json.loads(Path('.graphify_extract.json').read_text())
print(f'Final graph: {len(extract["nodes"])} nodes, {len(extract["edges"])} edges')
