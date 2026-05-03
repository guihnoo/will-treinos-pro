import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

def main():
    # Load merged extraction
    extraction = json.loads(Path('.graphify_extract.json').read_text())
    detection = json.loads(Path('.graphify_detect_incremental.json').read_text())

    # Build graph
    G = build_from_json(extraction)
    print(f'Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')

    # Cluster
    communities = cluster(G)
    cohesion = score_all(G, communities)
    print(f'Communities: {len(communities)}')

    # Analysis
    tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: 'Community ' + str(cid) for cid in communities}
    questions = suggest_questions(G, communities, labels)

    # Generate report
    report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, '.', suggested_questions=questions)
    Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')

    # Export graph
    to_json(G, communities, 'graphify-out/graph.json')

    # Save analysis
    analysis = {
        'communities': {str(k): v for k, v in communities.items()},
        'cohesion': {str(k): v for k, v in cohesion.items()},
        'gods': gods,
        'surprises': surprises,
        'questions': questions,
    }
    Path('.graphify_analysis.json').write_text(json.dumps(analysis, indent=2), encoding='utf-8')

    print(f'Rebuild complete - {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities')

if __name__ == '__main__':
    main()
