#!/bin/bash
# Claude Code automation scripts for Entretien Prestige

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Run Claude Code with specified agent
run_agent() {
    local agent_name=$1
    shift
    local args="$@"

    log_info "Starting agent: $agent_name"
    claude --agent "$agent_name" --output-format json "$args"
}

# Run Claude Code with specified skill
run_skill() {
    local skill_name=$1
    shift
    local args="$@"

    log_info "Running skill: $skill_name"
    claude --skill "$skill_name" --output-format json "$args"
}

# Generate API route with tests
generate_api_route() {
    local route_path=$1
    local description=$2

    log_info "Generating API route: $route_path"

    # Generate route
    claude --skill api-builder \
        --output-format json \
        --append-system-prompt "Create $route_path: $description" \
        > /tmp/api-result.json

    # Check if successful
    if [ $? -eq 0 ]; then
        log_success "API route generated"

        # Generate tests
        log_info "Generating tests..."
        claude --skill test-generator \
            --output-format json \
            --append-system-prompt "Create tests for app/api/$route_path/route.ts" \
            > /tmp/test-result.json

        if [ $? -eq 0 ]; then
            log_success "Tests generated"
        else
            log_error "Failed to generate tests"
            exit 1
        fi
    else
        log_error "Failed to generate API route"
        exit 1
    fi
}

# Generate complete feature
generate_feature() {
    local feature_name=$1
    local description=$2

    log_info "Generating feature: $feature_name"

    claude --agent feature-builder \
        --output-format json \
        --append-system-prompt "Implement feature from spec: $feature_name - $description" \
        > /tmp/feature-result.json

    if [ $? -eq 0 ]; then
        log_success "Feature generated"
        log_info "Running tests..."

        npm test

        if [ $? -eq 0 ]; then
            log_success "All tests passed"
        else
            log_error "Tests failed"
            exit 1
        fi
    else
        log_error "Failed to generate feature"
        exit 1
    fi
}

# Run code review
run_code_review() {
    local target=${1:-.}

    log_info "Running code review on: $target"

    claude --agent code-reviewer \
        --output-format json \
        --output-style code-review \
        --append-system-prompt "Review code in $target against spec" \
        > /tmp/review-result.json

    if [ $? -eq 0 ]; then
        # Parse JSON and display results
        log_success "Code review complete"
        cat /tmp/review-result.json | jq -r '.summary'
    else
        log_error "Code review failed"
        exit 1
    fi
}

# Fix bugs
fix_bug() {
    local bug_description=$1

    log_info "Attempting to fix bug: $bug_description"

    claude --agent bug-hunter \
        --output-format json \
        --append-system-prompt "Fix bug: $bug_description" \
        > /tmp/bug-fix-result.json

    if [ $? -eq 0 ]; then
        log_success "Bug fix applied"
        log_info "Running tests to verify fix..."

        npm test

        if [ $? -eq 0 ]; then
            log_success "Tests passed - bug fix verified"
        else
            log_error "Tests failed after bug fix"
            exit 1
        fi
    else
        log_error "Failed to fix bug"
        exit 1
    fi
}

# Pre-deployment check
pre_deploy_check() {
    log_info "Running pre-deployment checks"

    claude --agent deploy-manager \
        --output-format json \
        --append-system-prompt "Verify project is ready for production deployment" \
        > /tmp/deploy-check-result.json

    if [ $? -eq 0 ]; then
        local status=$(cat /tmp/deploy-check-result.json | jq -r '.deploymentReady')

        if [ "$status" = "true" ]; then
            log_success "Project is ready for deployment"
        else
            log_warning "Project is NOT ready for deployment"
            cat /tmp/deploy-check-result.json | jq -r '.blockers[]'
            exit 1
        fi
    else
        log_error "Pre-deployment check failed"
        exit 1
    fi
}

# Batch test generation
generate_all_tests() {
    log_info "Generating tests for all untested files"

    # Find TypeScript files without corresponding test files
    for file in $(find app lib -name "*.ts" -o -name "*.tsx" | grep -v ".test."); do
        local test_file="tests/${file%.ts*}.test.ts"

        if [ ! -f "$test_file" ]; then
            log_info "Generating tests for: $file"

            claude --skill test-generator \
                --output-format json \
                --append-system-prompt "Create tests for $file" \
                > /dev/null 2>&1

            if [ $? -eq 0 ]; then
                log_success "Tests generated for $file"
            else
                log_warning "Failed to generate tests for $file"
            fi
        fi
    done

    log_success "Batch test generation complete"
}

# Update documentation
update_docs() {
    local change_description=$1

    log_info "Updating documentation: $change_description"

    claude --skill docs-updater \
        --output-format json \
        --append-system-prompt "Update docs: $change_description" \
        > /tmp/docs-result.json

    if [ $? -eq 0 ]; then
        log_success "Documentation updated"
    else
        log_error "Failed to update documentation"
        exit 1
    fi
}

# CI/CD integration
run_ci_checks() {
    log_info "Running CI/CD checks"

    # Build
    log_info "Building..."
    npm run build
    if [ $? -ne 0 ]; then
        log_error "Build failed"
        exit 1
    fi
    log_success "Build passed"

    # Lint
    log_info "Linting..."
    npm run lint
    if [ $? -ne 0 ]; then
        log_error "Lint failed"
        exit 1
    fi
    log_success "Lint passed"

    # Tests
    log_info "Testing..."
    npm test -- --run --coverage
    if [ $? -ne 0 ]; then
        log_error "Tests failed"
        exit 1
    fi
    log_success "Tests passed"

    # Check coverage
    if ! grep -q "100" coverage/coverage-summary.json; then
        log_error "Coverage is not 100%"
        exit 1
    fi
    log_success "Coverage at 100%"

    log_success "All CI/CD checks passed"
}

# Main command handler
case "$1" in
    agent)
        run_agent "$2" "${@:3}"
        ;;
    skill)
        run_skill "$2" "${@:3}"
        ;;
    generate-api)
        generate_api_route "$2" "$3"
        ;;
    generate-feature)
        generate_feature "$2" "$3"
        ;;
    review)
        run_code_review "$2"
        ;;
    fix-bug)
        fix_bug "$2"
        ;;
    pre-deploy)
        pre_deploy_check
        ;;
    generate-tests)
        generate_all_tests
        ;;
    update-docs)
        update_docs "$2"
        ;;
    ci)
        run_ci_checks
        ;;
    *)
        echo "Usage: $0 {agent|skill|generate-api|generate-feature|review|fix-bug|pre-deploy|generate-tests|update-docs|ci}"
        echo ""
        echo "Commands:"
        echo "  agent <name> [args]           Run specified agent"
        echo "  skill <name> [args]           Run specified skill"
        echo "  generate-api <path> <desc>    Generate API route with tests"
        echo "  generate-feature <name> <desc> Generate complete feature"
        echo "  review [target]               Run code review"
        echo "  fix-bug <description>         Attempt to fix bug"
        echo "  pre-deploy                    Run pre-deployment checks"
        echo "  generate-tests                Generate tests for untested files"
        echo "  update-docs <description>     Update documentation"
        echo "  ci                            Run CI/CD checks"
        exit 1
        ;;
esac
