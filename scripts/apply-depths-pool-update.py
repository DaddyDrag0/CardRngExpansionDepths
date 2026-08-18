from pathlib import Path


def patch(path: str, replacements: list[tuple[str, str]]) -> None:
    file = Path(path)
    text = file.read_text()
    for old, new in replacements:
        if old not in text:
            raise SystemExit(f"Missing expected text in {path}: {old!r}")
        text = text.replace(old, new)
    file.write_text(text)


patch('src/engine/depths.ts', [
    ("const HARD_EXCLUSIONS = new Set([\n  'Samurai', 'Seraphim', 'Vampire Lord', 'Loki', 'Fuxi', 'Parallax',\n  'Nán Fāng Zhū Què', 'Brachiosaurus', 'Jersey Devil',\n])", "const HARD_EXCLUSIONS = new Set(['Vampire Lord'])"),
    ('export const MAX_DEPTH_BANS = 10', 'export const MAX_DEPTH_BANS = 12'),
])

patch('index.html', [
    ('const MAX_DEPTH_BANS=10;', 'const MAX_DEPTH_BANS=12;'),
    ("const DEPTHS_DEFAULT_BANS=new Set(['Samurai','Seraphim','Vampire Lord','Loki','Fuxi','Parallax','Nán Fāng Zhū Què','Brachiosaurus','Jersey Devil']);", "const DEPTHS_DEFAULT_BANS=new Set(['Vampire Lord']);"),
    ('Choose anywhere from 0 to 10.', 'Choose anywhere from 0 to 12.'),
    ("'10/10 bans selected'", "'12/12 bans selected'"),
])
