# 🚀 MathVerse

**Your Universe for Mathematical Exploration and AI Assistance.**

MathVerse is an interactive, AI-powered web application designed to be a comprehensive toolkit for students, educators, and math enthusiasts. It combines powerful computational engines with intuitive visualizations and AI-guided explanations to make learning and working with complex mathematical concepts easier and more engaging.

## ✨ Key Features

- **AI-Powered Core**: At its heart, MathVerse uses AI to classify expressions, suggest solution strategies, and power its various tools.
- **Dedicated Workstations**: A suite of specialized tools for different mathematical domains:
    - **Algebra**: Simplify, factor, and solve algebraic expressions with step-by-step AI guidance.
    - **Calculus Engine**: Compute definite/indefinite integrals and solve differential equations, complete with detailed steps and visualizations.
    - **Matrix & Vector Operations**: Perform a wide range of linear algebra calculations, from basic arithmetic to eigenvalues and LU decomposition.
    - **Linear Transformations Visualizer**: See the effect of a 3x3 matrix on 3D space in real-time with an interactive Three.js canvas.
    - **Graph Theory Explorer**: Interactively build, visualize, and analyze graphs. Run algorithms like BFS, DFS, and Dijkstra's on a custom graph.
    - **Statistics Analyzer**: Input datasets to get descriptive statistics, histograms, box plots, and linear regression analysis.
    - **Graphing Calculator**: A full-featured Desmos calculator for advanced plotting and geometric exploration.
- **WolframAlpha Workspace**: Leverage the power of WolframAlpha's computational engine directly within the app for any query, with results displayed in a structured format.
- **User Authentication**: Secure sign-in and sign-up functionality powered by Firebase Authentication, providing a personalized dashboard experience.
- **Responsive & Modern UI**: Built with Next.js, ShadCN UI, and Tailwind CSS for a clean, modern, and fully responsive user experience on any device.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **AI/Backend**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **Authentication & Backend Services**: [Firebase](https://firebase.google.com/)
- **3D Graphics**: [Three.js](https://threejs.org/)
- **Graph Visualization**: [React Flow (@xyflow/react)](https://reactflow.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## ⚙️ Development

This project uses [pnpm](https://pnpm.io/) as the package manager.

### Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd mathverse
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env.local` file in the root of the project. This file stores your secret keys and configuration. Populate it with your Firebase project credentials and your WolframAlpha App ID.

    ```env
    # Firebase Configuration (Required for Auth & Functions)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

    # Google AI / Genkit (Required for AI Flows)
    # Ensure your GOOGLE_API_KEY is available in the environment where Genkit runs
    # You can set it here or export it in your shell.
    GOOGLE_API_KEY="YOUR_GOOGLE_AI_API_KEY"
    
    # WolframAlpha (Required for WolframAlpha Workspace)
    # You can get a free App ID for development from the WolframAlpha Developer Portal.
    WOLFRAM_ALPHA_APP_ID="YOUR_WOLFRAM_APP_ID"
    ```
    **Important**: Ensure `.env.local` is added to your `.gitignore` file to keep your credentials private.

4.  **Run the development server**:
    This command starts both the Next.js frontend and the Genkit AI server concurrently.
    ```bash
    pnpm dev
    ```
    The application will typically be available at `http://localhost:9002`.

### Available Scripts

-   `pnpm dev`: Starts the Next.js development server and the Genkit development server simultaneously.
-   `pnpm genkit:dev`: Starts only the Genkit development server.
-   `pnpm genkit:watch`: Starts the Genkit development server with file watching for automatic restarts on changes.
-   `pnpm build`: Builds the application for production.
-   `pnpm start`: Starts the production server after a successful build.
-   `pnpm lint`: Runs the Next.js linter to check for code quality issues.
-   `pnpm typecheck`: Runs the TypeScript compiler to check for type errors.

Remember to use `pnpm` for all package management tasks (e.g., `pnpm add <package-name>`).
