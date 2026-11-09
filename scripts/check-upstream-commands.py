"""Run the original checker; recognize only its two known pytest-forwarding false positives."""
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1] / 'upstream'
result = subprocess.run(
    [sys.executable, str(root / 'check_commands.py'), '--json'],
    cwd=root, capture_output=True, text=True, encoding='utf-8',
)
report = json.loads(result.stdout)
if result.returncode == 0:
    print('Upstream command checker: clean')
    sys.exit(0)
expected = {
    ('docs/tool-verification/EXTENSION-reconstruction.md', 300, 'python tests/run_tests.py -q'),
    ('docs/tool-verification/EXTENSION-test-harness.md', 31, 'python tests/run_tests.py -q -m unit'),
}
found = {
    (item['doc'], item['line'], item['command'])
    for item in report['findings']
    if item['kind'] == 'unknown-flag' and item.get('script') == 'run_tests.py'
    and item.get('flag') == '-q'
}
if result.returncode == 1 and report['summary']['drift'] == 2 and found == expected:
    # run_tests.py forwards argv[1:] directly to pytest.main(). -q is valid.
    # Keep upstream immutable and the exception limited to these exact findings.
    print('Known upstream checker limitation: two -q false positives for the pytest forwarding wrapper.')
    sys.exit(0)
print(result.stdout)
print(result.stderr, file=sys.stderr)
sys.exit(result.returncode or 1)
