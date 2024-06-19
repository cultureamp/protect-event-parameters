# protect-event-parameters

A Github action that ensures `repository_dispatch` event parameters are not shown in Github actions build output. These
parameters are the contents of the `client_payload` field from the event.

## Usage

### Inputs

#### `allowlist`

**Optional** A comma-separated list of parameters that should be ignored by this action.
This allows non-secret fields to be excluded from protection.

## Example usage

```yaml
uses: cultureamp/protect-event-parameters@v2
with:
  allowlist: 'field1,field2'
```

Given a `client_payload` that contains `field_1`, `field_2` and `field_3`, after this
action runs the value supplied in `field_3` will be masked from all log outputs (using
the appropriate [workflow commands](https://help.github.com/en/actions/reference/workflow-commands-for-github-actions#masking-a-value-in-log)).

## Building

> Note that the compiled output is committed to the repo, as required by GH actions.

```bash
# download dependencies
pnpm install --frozen-lockfile

# packs result
pnpm run build
```

The build uses [@vercel/ncc](https://github.com/vercel/ncc) to compile dependencies into one file, rather than requiring `node_modules` to be committed.
