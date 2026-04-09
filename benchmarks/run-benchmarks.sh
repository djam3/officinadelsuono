#!/usr/bin/env bash
# Loki Mode Benchmark Runner v2.35.0
# Usage:
#   ./benchmarks/run-benchmarks.sh humaneval --execute --loki
#   ./benchmarks/run-benchmarks.sh swebench --execute --loki

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }

usage() {
  echo "Usage: $0 <benchmark> [options]"
  echo ""
  echo "Benchmarks:"
  echo "  humaneval    Run HumanEval coding benchmark"
  echo "  swebench     Run SWE-bench software engineering benchmark"
  echo "  project      Run project-specific quality benchmarks"
  echo ""
  echo "Options:"
  echo "  --execute    Actually run the benchmarks (default: dry run)"
  echo "  --loki       Run in Loki Mode (multi-agent)"
  echo "  --verbose    Show detailed output"
  echo "  --report     Generate HTML report"
  echo ""
  exit 1
}

# Ensure results directory exists
mkdir -p "$RESULTS_DIR"

# Parse arguments
BENCHMARK="${1:-}"
EXECUTE=false
LOKI_MODE=false
VERBOSE=false
REPORT=false

shift || true
while [[ $# -gt 0 ]]; do
  case $1 in
    --execute) EXECUTE=true ;;
    --loki) LOKI_MODE=true ;;
    --verbose) VERBOSE=true ;;
    --report) REPORT=true ;;
    *) log_error "Unknown option: $1"; usage ;;
  esac
  shift
done

if [[ -z "$BENCHMARK" ]]; then
  usage
fi

# Project-specific benchmarks
run_project_benchmarks() {
  log_info "Running project-specific benchmarks for officinadelsuono..."
  
  local results_file="$RESULTS_DIR/project_$TIMESTAMP.json"
  local pass_count=0
  local fail_count=0
  local total=0
  
  # Benchmark 1: TypeScript compilation
  log_info "Benchmark: TypeScript compilation..."
  total=$((total + 1))
  if cd "$PROJECT_ROOT" && npx tsc --noEmit 2>/dev/null; then
    log_success "TypeScript compilation: PASS"
    pass_count=$((pass_count + 1))
  else
    log_error "TypeScript compilation: FAIL"
    fail_count=$((fail_count + 1))
  fi
  
  # Benchmark 2: Build
  log_info "Benchmark: Production build..."
  total=$((total + 1))
  if cd "$PROJECT_ROOT" && npm run build 2>/dev/null; then
    log_success "Production build: PASS"
    pass_count=$((pass_count + 1))
  else
    log_error "Production build: FAIL"
    fail_count=$((fail_count + 1))
  fi
  
  # Benchmark 3: Bundle size check
  log_info "Benchmark: Bundle size..."
  total=$((total + 1))
  if [[ -d "$PROJECT_ROOT/dist" ]]; then
    local bundle_size
    bundle_size=$(du -sk "$PROJECT_ROOT/dist" | cut -f1)
    if [[ $bundle_size -lt 10240 ]]; then # Less than 10MB
      log_success "Bundle size: ${bundle_size}KB (< 10MB limit)"
      pass_count=$((pass_count + 1))
    else
      log_error "Bundle size: ${bundle_size}KB (exceeds 10MB limit)"
      fail_count=$((fail_count + 1))
    fi
  else
    log_warning "Bundle size: dist/ not found (build might have failed)"
    fail_count=$((fail_count + 1))
  fi
  
  # Benchmark 4: No secrets in source
  log_info "Benchmark: Secret detection..."
  total=$((total + 1))
  if ! grep -rn "RESEND_API_KEY\|GEMINI_API_KEY\|STRIPE_SECRET" \
    --include="*.ts" --include="*.tsx" --include="*.js" \
    "$PROJECT_ROOT/src" 2>/dev/null | grep -v "process.env" | grep -v "\.env" | grep -qv "example"; then
    log_success "Secret detection: PASS (no hardcoded secrets)"
    pass_count=$((pass_count + 1))
  else
    log_error "Secret detection: FAIL (potential secrets found in source)"
    fail_count=$((fail_count + 1))
  fi
  
  # Benchmark 5: No any types (approximate check)
  log_info "Benchmark: Type safety..."
  total=$((total + 1))
  local any_count
  any_count=$(grep -rn ": any" --include="*.ts" --include="*.tsx" "$PROJECT_ROOT/src" 2>/dev/null | wc -l)
  if [[ $any_count -lt 10 ]]; then
    log_success "Type safety: PASS ($any_count 'any' usages found)"
    pass_count=$((pass_count + 1))
  else
    log_warning "Type safety: WARN ($any_count 'any' usages found, target < 10)"
    fail_count=$((fail_count + 1))
  fi
  
  # Benchmark 6: Large file detection
  log_info "Benchmark: File size limits..."
  total=$((total + 1))
  local large_files
  large_files=$(find "$PROJECT_ROOT/src" -name "*.tsx" -o -name "*.ts" | xargs wc -c 2>/dev/null | sort -rn | head -5)
  local largest
  largest=$(echo "$large_files" | head -1 | awk '{print $1}')
  if [[ ${largest:-0} -lt 250000 ]]; then
    log_success "File size limits: PASS (largest file: ${largest:-0} bytes)"
    pass_count=$((pass_count + 1))
  else
    log_warning "File size limits: WARN (largest file: ${largest:-0} bytes, limit 250KB)"
    fail_count=$((fail_count + 1))
  fi
  
  # Summary
  echo ""
  echo "=========================================="
  echo "  Project Benchmark Results"
  echo "=========================================="
  echo "  Total:  $total"
  echo "  Passed: $pass_count"
  echo "  Failed: $fail_count"
  echo "  Score:  $(( (pass_count * 100) / total ))%"
  echo "=========================================="
  
  # Save results
  cat > "$results_file" <<EOF
{
  "benchmark": "project",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total": $total,
  "passed": $pass_count,
  "failed": $fail_count,
  "score": $(( (pass_count * 100) / total )),
  "loki_mode": $LOKI_MODE
}
EOF
  
  log_info "Results saved to: $results_file"
}

run_humaneval_benchmarks() {
  log_info "HumanEval benchmark..."
  
  if [[ "$EXECUTE" == "false" ]]; then
    log_warning "Dry run mode. Use --execute to actually run benchmarks."
    log_info "HumanEval would test code generation capabilities across 164 problems."
    return 0
  fi
  
  log_info "HumanEval benchmarks require external setup."
  log_info "See: https://github.com/openai/human-eval"
  log_warning "Skipping: External benchmark infrastructure not configured."
}

run_swebench_benchmarks() {
  log_info "SWE-bench benchmark..."
  
  if [[ "$EXECUTE" == "false" ]]; then
    log_warning "Dry run mode. Use --execute to actually run benchmarks."
    log_info "SWE-bench would test software engineering task resolution."
    return 0
  fi
  
  log_info "SWE-bench benchmarks require external setup."
  log_info "See: https://swe-bench.github.io/"
  log_warning "Skipping: External benchmark infrastructure not configured."
}

# Main
case "$BENCHMARK" in
  humaneval) run_humaneval_benchmarks ;;
  swebench) run_swebench_benchmarks ;;
  project) run_project_benchmarks ;;
  *) log_error "Unknown benchmark: $BENCHMARK"; usage ;;
esac

log_info "Benchmark run complete."
