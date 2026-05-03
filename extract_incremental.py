import json
from pathlib import Path
from graphify.extract import collect_files, extract

def main():
    # Load incremental detection result
    detect_inc = json.loads(Path('.graphify_detect_incremental.json').read_text())
    new_files = detect_inc.get('new_files', {})

    # Collect new code files only (AST extraction is fast and free)
    new_code_files = []
    for f in new_files.get('code', []):
        file_path = Path(f)
        if file_path.is_dir():
            new_code_files.extend(collect_files(file_path))
        else:
            new_code_files.append(file_path)

    print(f'New code files to extract: {len(new_code_files)}')

    # Run AST extraction on new files
    if new_code_files:
        result = extract(new_code_files)
        Path('.graphify_ast_incremental.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
        print(f'AST Incremental: {len(result["nodes"])} nodes, {len(result["edges"])} edges')
    else:
        Path('.graphify_ast_incremental.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}), encoding='utf-8')
        print('No new code files to extract')

    # Check if semantic re-extraction needed (new docs/images)
    new_non_code = sum(len(new_files.get(k, [])) for k in ['docs', 'papers', 'images', 'video'])
    if new_non_code > 0:
        print(f'New docs/images detected: {new_non_code} files (would need semantic extraction)')
    else:
        print('No new docs/images - semantic extraction skipped')

if __name__ == '__main__':
    main()
