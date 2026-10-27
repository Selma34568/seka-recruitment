"""Dependency-free sanity checks; not a replacement for integration tests."""
import ast
from pathlib import Path
root=Path(__file__).resolve().parent
for name in ('models.py','main.py','intake.py','seka_features.py'):
    ast.parse((root/name).read_text(encoding='utf-8'))
print('PASS: Python syntax for all modified backend files')
text=(root/'migrations/001_seka_features.sql').read_text()
assert 'DROP TABLE' not in text.upper() and 'TRUNCATE ' not in text.upper()
print('PASS: Migration has no drop or truncate statements')
assert 'email_sent": False' in (root/'seka_features.py').read_text()
print('PASS: Demo mail explicitly reports not sent')
