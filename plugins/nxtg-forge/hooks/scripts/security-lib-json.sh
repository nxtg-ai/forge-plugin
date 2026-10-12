#!/bin/bash
#
# NXTG-Forge Security: hook-input reader shared by the blocking guards (sourced, not a hook).
#
# The guards used to read tool input with jq only, and allowed every call when jq was missing,
# so on a clean machine (ubuntu:24.04 ships no jq) all 4 blocking guards were off (alpha run 1,
# F-E). This reader uses jq when present and otherwise a POSIX awk decoder. When it cannot read
# the input at all, it returns 3 and the guard blocks: a guard never allows because a parser is
# missing.
#
# Usage:  source security-lib-json.sh
#         VALUE=$(security_json_field "$INPUT" tool_input.command) || security_fail_closed
#
# Return: 0 = read (VALUE may be empty when the key is absent), 3 = could not read the input.

security_json_field() {
    local input="$1" path="$2" key value
    [ -z "$input" ] && return 0
    key="${path##*.}"

    if command -v jq >/dev/null 2>&1; then
        value=$(printf '%s' "$input" | jq -r ".${path} // empty" 2>/dev/null) || return 3
        printf '%s' "$value"
        return 0
    fi

    if command -v awk >/dev/null 2>&1; then
        # Finds the first `"<key>"<ws>:<ws>"` and decodes that JSON string. Inside a JSON string
        # every quote is escaped, so `"<key>"` followed by `:` can only be a real key.
        # Exit 0 = found or absent (absent prints nothing), 3 = the value's string never closed.
        printf '%s' "$input" | awk -v key="$key" '
            { buf = buf (NR > 1 ? "\n" : "") $0 }
            END {
                pat = "\"" key "\"[ \t\r\n]*:[ \t\r\n]*\""
                if (!match(buf, pat)) exit 0
                s = substr(buf, RSTART + RLENGTH)
                out = ""; n = length(s); i = 1
                while (i <= n) {
                    c = substr(s, i, 1)
                    if (c == "\"") { printf "%s", out; exit 0 }
                    if (c == "\\") {
                        i++; e = substr(s, i, 1)
                        if (e == "n") out = out "\n"
                        else if (e == "t") out = out "\t"
                        else if (e == "r") out = out "\r"
                        else if (e == "b" || e == "f") out = out " "
                        else if (e == "u") {
                            h = tolower(substr(s, i + 1, 4)); v = 0
                            for (k = 1; k <= 4; k++) v = v * 16 + index("0123456789abcdef", substr(h, k, 1)) - 1
                            out = out ((v > 0 && v < 128) ? sprintf("%c", v) : "?")
                            i += 4
                        }
                        else out = out e
                    } else out = out c
                    i++
                }
                exit 3
            }'
        return $?
    fi

    return 3
}

# Block the tool call because the input could not be read. Never allow on a parse failure.
security_fail_closed() {
    echo "SECURITY BLOCK: this Forge guard could not read the tool input (it needs jq or awk). Install jq (apt install jq / brew install jq) and retry." >&2
    exit 2
}
