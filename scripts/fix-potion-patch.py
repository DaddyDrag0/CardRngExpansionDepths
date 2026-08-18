from pathlib import Path

path = Path('scripts/apply-depths-potion-rewards.py')
text = path.read_text()
old = '''replace(
    'src/browser-worker.ts',
    "  bannedCardNames?: string[]\\n}",
    "  bannedCardNames?: string[]\\n  bountifulDepths?: boolean\\n}",
    1,
)'''
new = '''replace(
    'src/browser-worker.ts',
    "  seed: number\\n  bannedCardNames?: string[]\\n}",
    "  seed: number\\n  bannedCardNames?: string[]\\n  bountifulDepths?: boolean\\n}",
    1,
)'''
if old not in text:
    raise SystemExit('Potion patch browser-worker anchor block not found')
path.write_text(text.replace(old, new, 1))
