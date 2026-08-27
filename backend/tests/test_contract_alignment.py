from pathlib import Path
import re

from app.models import AnalysisRequest


def test_typescript_and_pydantic_request_field_names_match() -> None:
    backend_root = Path(__file__).resolve().parents[1]
    candidates = (
        backend_root.parent / "web" / "lib" / "contracts.ts",
        backend_root.parent / "frontend" / "lib" / "contracts.ts",
    )
    contract_path = next((candidate for candidate in candidates if candidate.exists()), None)
    assert contract_path is not None, "TypeScript contract not found beside backend"

    source = contract_path.read_text(encoding="utf-8")
    interface = re.search(r"export interface AnalysisRequest\s*\{(?P<body>.*?)\n\}", source, re.DOTALL)
    assert interface is not None, "AnalysisRequest interface not found"
    typescript_fields = set(re.findall(r"^\s*(\w+):", interface.group("body"), re.MULTILINE))

    assert typescript_fields == set(AnalysisRequest.model_fields)
