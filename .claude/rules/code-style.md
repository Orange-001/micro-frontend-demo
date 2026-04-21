# Code Style Compliance

## Prettier Configuration

All generated code MUST follow the project's Prettier configuration:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

**Key Requirements:**
- Use semicolons at the end of statements
- Use single quotes for strings (not double quotes)
- Add trailing commas in arrays, objects, and function parameters
- Maximum line width: 100 characters

**Ignored Files (`.prettierignore`):**
- `*.md` - Markdown files (documentation)
- `pnpm-lock.yaml` - Lock file
- `**/iconfont.js`, `**/iconfont.css` - Third-party iconfont generated files

## ESLint Rules

All generated code MUST comply with the project's ESLint configuration:

### TypeScript Rules
- No unused variables (`@typescript-eslint/no-unused-vars`)
- Use `const` for variables that are never reassigned (`prefer-const`)
- Avoid unnecessary escape characters in regex (`no-useless-escape`)

### React Rules
- Every element in an array MUST have a unique `key` prop (`react/jsx-key`)
- No unnecessary escape characters in JSX

### Vue Rules (for .vue files)
- Vue 3 recommended patterns (`plugin:vue/vue3-recommended`)
- Template formatting handled by Prettier

**Ignored Files (`.eslintrc.cjs`):**
- `dist/`, `node_modules/` - Build and dependencies
- `**/assets/iconfont/iconfont.js` - Third-party iconfont generated files

## Code Generation Checklist

Before writing any code:

1. **Strings**: Use single quotes
   ```typescript
   const message = 'Hello world';  // ✅ Correct
   const message = "Hello world";  // ❌ Wrong
   ```

2. **Semicolons**: Always add semicolons
   ```typescript
   const x = 1;  // ✅ Correct
   const x = 1   // ❌ Wrong
   ```

3. **Trailing Commas**: Add in multi-line structures
   ```typescript
   const config = {
     name: 'app',
     version: '1.0.0',  // ✅ Trailing comma
   };
   ```

4. **Line Width**: Keep lines under 100 characters. Break long lines appropriately.

5. **Array Elements**: Always include `key` prop
   ```typescript
   items.map((item) => (
     <Component key={item.id} />  // ✅ Required
   ));
   ```

6. **Imports**: Only import what is used
   ```typescript
   import { Steps } from 'antd';           // ✅ Correct
   import { Steps, Tag } from 'antd';      // ❌ If Tag is unused
   ```

7. **Variables**: Use `const` when value never changes
   ```typescript
   const config = getConfig();  // ✅ Correct
   let config = getConfig();    // ❌ Wrong if never reassigned
   ```

## Enforcement

After generating code:
- Run `pnpm format` to apply Prettier formatting
- Run `pnpm lint` to check ESLint compliance
- Fix any errors before finalizing code