npmdd .# MathVerse

This project is the MathVerse application, your universe for mathematical exploration and AI assistance.

## Development

This project uses [pnpm](https://pnpm.io/) as the package manager.

### Getting Started

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Set up Environment Variables**:
    Create a `.env.local` file in the root of the project and populate it with your Firebase project credentials and any other necessary API keys:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    # ... other Firebase variables ...

    # OPENAI_API_KEY="YOUR_OPENAI_KEY" # If using OpenAI
    ```
    Ensure `.env.local` is added to your `.gitignore` file.

3.  **Run the development server**:
    ```bash
    pnpm dev
    ```
    This will start the Next.js application, typically on `http://localhost:9002`.

4.  **Run Genkit development server** (for testing AI flows locally, if needed):
    In a separate terminal:
    ```bash
    pnpm genkit:dev
    ```
    Or for watching changes:
    ```bash
    pnpm genkit:watch
    ```

### Available Scripts

-   `pnpm dev`: Starts the Next.js development server.
-   `pnpm genkit:dev`: Starts the Genkit development server.
-   `pnpm genkit:watch`: Starts the Genkit development server with file watching.
-   `pnpm build`: Builds the application for production.
-   `pnpm start`: Starts the production server.
-   `pnpm lint`: Runs Next.js linter.
-   `pnpm typecheck`: Runs TypeScript type checking.

Remember to use `pnpm` for all package management tasks (e.g., `pnpm add <package-name>`).
