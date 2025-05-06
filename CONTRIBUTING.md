- **type**: Type of change (see below)
- **scope**: Optional. Area of the codebase affected (`ui`, `api`, `store`, etc.)
- **summary**: Short, imperative sentence describing the change

---

### 📘 Common Types

| Type        | Description                                          | Example                                                       |
|-------------|------------------------------------------------------|---------------------------------------------------------------|
| `feat`      | A new feature                                        | `feat(ui): add date picker component`                         |
| `fix`       | A bug fix                                            | `fix(storage): handle null value in loadTasks()`              |
| `docs`      | Documentation changes                                | `docs: update README with deployment instructions`            |
| `style`     | Code formatting only (no logic changes)              | `style: run Prettier on all Svelte files`                     |
| `refactor`  | Code refactoring (no new features or bug fixes)      | `refactor(store): simplify chores store logic`                |
| `perf`      | Performance improvements                             | `perf(ui): virtualize task list for large datasets`           |
| `test`      | Adding or updating tests                             | `test(dutyStore): add unit tests for addMember()`             |
| `chore`     | Misc tasks like dependency updates, build config     | `chore: initialize Chore-pal project with SvelteKit`          |
| `ci`        | CI/CD-related changes                                | `ci: add GitHub Actions workflow for deployment`              |
| `build`     | Changes to build tools or dependencies               | `build: bump SvelteKit to v1.0.0`                             |

---

### 🧪 Example Commit Messages

```bash
feat(schedule): allow custom recurring tasks
fix(api): handle empty response from Firestore
docs: add deployment steps to README
style: format all files with Prettier
refactor(ui): extract reusable TaskCard component
test(storage): add unit test for loadDataFromLocalStorage()
chore: setup Tailwind CSS and ESLint
