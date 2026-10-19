#!/usr/bin/env python3
"""
scripts/evaluate_claims.py
Extracts the technical context for a specific claim so it can be evaluated by an LLM.
Usage: python scripts/evaluate_claims.py <claim-id>
"""
import sys
import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLAIMS_FILE = ROOT / "docs" / "claims.yaml"

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/evaluate_claims.py <claim-id>")
        print("Example: python scripts/evaluate_claims.py claim-dataops-schema-001")
        sys.exit(1)
        
    claim_id = sys.argv[1]
    
    if not CLAIMS_FILE.exists():
        print(f"[FATAL] {CLAIMS_FILE} not found")
        sys.exit(1)
        
    claims = yaml.safe_load(CLAIMS_FILE.read_text(encoding="utf-8")).get("claims", [])
    claim = next((c for c in claims if c["id"] == claim_id), None)
    
    if not claim:
        print(f"[ERROR] Claim '{claim_id}' not found in {CLAIMS_FILE}")
        sys.exit(1)
        
    print("=" * 70)
    print(f"CLAIM TO EVALUATE: {claim_id}")
    print(f"DESCRIPTION: {claim['description']}")
    print(f"IMPLEMENTATION: {claim['implementation']}")
    print("=" * 70)
    print()
    
    spec_path = ROOT / claim["implementation"]
    
    if spec_path.exists() and spec_path.suffix == ".yaml":
        print("RELEVANT YAML SPECIFICATION:")
        print("-" * 70)
        data = yaml.safe_load(spec_path.read_text(encoding="utf-8"))
        
        rule_ids = claim["verification"].get("rule_ids", [])
        if "rule_id" in claim["verification"]:
            rule_ids = [claim["verification"]["rule_id"]]
            
        found = False
        for r in data.get("rules", []):
            if not rule_ids or r.get("id") in rule_ids:
                print(yaml.safe_dump(r, sort_keys=False))
                found = True
                
        if not found:
            print(f"(No matching rules found for {rule_ids})")
            
    else:
        print(f"NOTE: {claim['implementation']} is not a YAML spec file.")
        print("Verify this claim by checking the file existence or running the associated tool directly.")
        
    print("-" * 70)
    print("\nNext Steps:")
    print("1. Copy the YAML above into your grounded prompt builder.")
    print("2. Ask the LLM: 'Does this YAML rule satisfy the description?'")
    print("3. If the LLM says no, update the YAML or the claim description.")

if __name__ == "__main__":
    main()