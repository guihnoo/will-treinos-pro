import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.export import to_obsidian, to_canvas, to_html

def main():
    # Load extraction and analysis
    extraction = json.loads(Path('.graphify_extract.json').read_text())
    analysis = json.loads(Path('.graphify_analysis.json').read_text())

    # Load labels if they exist
    labels_file = Path('.graphify_labels.json')
    if labels_file.exists():
        labels_raw = json.loads(labels_file.read_text())
        labels = {int(k): v for k, v in labels_raw.items()}
    else:
        labels = {int(k): f'Community {k}' for k in analysis['communities'].keys()}

    # Build graph
    G = build_from_json(extraction)
    communities = {int(k): v for k, v in analysis['communities'].items()}
    cohesion = {int(k): v for k, v in analysis['cohesion'].items()}

    # Export to Obsidian
    try:
        to_obsidian(G, communities, 'graphify-out/obsidian', labels=labels)
        print(f'Obsidian vault generated: graphify-out/obsidian/')
    except Exception as e:
        print(f'Obsidian export skipped: {e}')

    # Export to HTML (try without cohesion if it fails)
    try:
        to_html(G, communities, labels, cohesion, 'graphify-out/graph.html')
        print(f'HTML visualization generated: graphify-out/graph.html')
    except Exception as e:
        try:
            to_html(G, communities, labels, {}, 'graphify-out/graph.html')
            print(f'HTML visualization generated (without cohesion): graphify-out/graph.html')
        except Exception as e2:
            print(f'HTML export failed: {e2}')

if __name__ == '__main__':
    main()
