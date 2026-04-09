# MCP Integration — Model Context Protocol

## Overview

MCP (Model Context Protocol) enables standardized communication between
AI models and external tools/services. In Loki Mode, MCP servers provide
agents with access to project resources and external APIs.

## MCP Server Capabilities

### File System Server

Provides agents with controlled access to the project file system:

```json
{
  "server": "filesystem",
  "capabilities": {
    "read_file": {
      "allowed_paths": ["src/", "functions/", "public/", "references/"],
      "max_file_size": "1MB",
      "encoding": "utf-8"
    },
    "write_file": {
      "allowed_paths": ["src/", "functions/"],
      "requires_approval": false,
      "backup_before_write": true
    },
    "list_directory": {
      "allowed_paths": ["./"],
      "recursive": true,
      "max_depth": 5
    },
    "search_files": {
      "allowed_paths": ["src/", "functions/"],
      "max_results": 50,
      "supports_regex": true
    }
  }
}
```

### Firebase Server

Provides agents with access to Firebase services:

```json
{
  "server": "firebase",
  "capabilities": {
    "firestore_read": {
      "collections": ["products", "users", "reviews", "settings", "newsletter_subscriptions"],
      "max_documents": 100
    },
    "firestore_write": {
      "collections": ["products", "settings", "social_posts"],
      "requires_approval": true,
      "validate_against_rules": true
    },
    "storage_read": {
      "buckets": ["officinadelsuono-87986.firebasestorage.app"],
      "max_file_size": "10MB"
    },
    "storage_write": {
      "buckets": ["officinadelsuono-87986.firebasestorage.app"],
      "allowed_paths": ["products/"],
      "requires_approval": true
    },
    "auth_verify": {
      "operations": ["verify_token", "check_admin_role"]
    }
  }
}
```

### Git Server

Provides agents with version control operations:

```json
{
  "server": "git",
  "capabilities": {
    "status": true,
    "diff": true,
    "log": { "max_entries": 50 },
    "commit": {
      "requires_semantic_message": true,
      "format": "type(scope): description"
    },
    "branch": {
      "create": true,
      "switch": true,
      "naming": "feature/{description} | fix/{description} | chore/{description}"
    },
    "push": {
      "requires_approval": true
    }
  }
}
```

### Terminal Server

Provides agents with controlled command execution:

```json
{
  "server": "terminal",
  "capabilities": {
    "run_command": {
      "allowed_commands": [
        "npm run build",
        "npm run lint",
        "npm run dev",
        "npx tsc --noEmit",
        "firebase deploy *",
        "firebase emulators:*"
      ],
      "blocked_commands": [
        "rm -rf",
        "del /s",
        "format",
        "curl * | bash"
      ],
      "timeout_ms": 60000,
      "cwd": "project_root"
    }
  }
}
```

### Browser Server

Provides agents with web browsing for research:

```json
{
  "server": "browser",
  "capabilities": {
    "navigate": {
      "allowed_domains": [
        "developer.mozilla.org",
        "react.dev",
        "firebase.google.com",
        "tailwindcss.com",
        "vitejs.dev",
        "framer.com/motion",
        "three.js",
        "stackoverflow.com",
        "github.com"
      ]
    },
    "screenshot": true,
    "extract_content": true,
    "fill_form": false,
    "click": false
  }
}
```

## MCP Message Format

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": "request-uuid",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "src/App.tsx"
    }
  }
}
```

## Security Considerations

1. All MCP servers run with least-privilege permissions
2. Write operations require agent tier-based approval
3. Network access is restricted to allowed domains
4. Command execution is whitelisted, not blacklisted
5. File operations are sandboxed to project directory
6. All MCP interactions are logged to episodic memory
