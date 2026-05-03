import json
from graphify.detect import detect_incremental
from pathlib import Path

try:
    result = detect_incremental(Path('.'))
    Path('.graphify_detect_incremental.json').write_text(json.dumps(result, indent=2), encoding='utf-8')

    new_files = result.get('new_files', [])
    modified_files = result.get('modified_files', [])
    print(f'Incremental detection: {len(new_files)} new, {len(modified_files)} modified')
    print(f'Code files: {len(result.get("files", {}).get("code", []))}')
    print(f'Docs/Images: {len([f for files in result.get("files", {}).values() for f in files if files != result.get("files", {}).get("code", [])])}')
except Exception as e:
    print(f'ERROR: {e}')
    # Fallback: full detection if incremental fails
    result = detect(Path('.'))
    Path('.graphify_detect_incremental.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(f'Fallback to full detection: {result.get("total_files")} files')
