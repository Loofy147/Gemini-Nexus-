# Gemini Nexus

Gemini Nexus is a sophisticated, multi-agent AI system designed for complex problem-solving. It leverages a dynamic swarm of specialized AI agents, orchestrated by a learning-based system, to tackle multifaceted tasks.

## Key Features

*   **Dynamic Orchestration:** Instead of a static, predefined workflow, Gemini Nexus uses a reinforcement learning-based orchestrator to dynamically select the best agent for each step of a task. This allows the system to adapt its approach based on the evolving context of the problem.
*   **Event-Driven Architecture:** The agents communicate and coordinate through an event bus and a shared blackboard, enabling asynchronous collaboration and reducing token overhead.
*   **Automated Evaluation:** An integrated evaluation suite continuously monitors the quality of the agents' work, providing metrics on faithfulness, hallucination, relevance, coherence, and groundedness.
*   **Adaptive Cortex:** The system features a learning engine that adapts its internal parameters based on the outcomes of previous tasks. This allows Gemini Nexus to improve its performance over time, replacing "magic numbers" with data-driven weights.
*   **Production-Ready Backend:** The backend is built with resilience in mind, featuring circuit breakers, rate limiting, input validation, and observability through OpenTelemetry.

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm (v8 or higher)
*   A Gemini API key

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/gemini-nexus.git
    cd gemini-nexus
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your-api-key
    ```

### Running the Application

1.  Build the server:
    ```bash
    npm run build:server
    ```
2.  Start the server:
    ```bash
    npm run server
    ```
3.  In a new terminal, start the client:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

## API Endpoints

*   `POST /api/swarm`: Executes the swarm with a given prompt and returns the final result, along with orchestrator and cortex stats.
*   `POST /api/chat`: Handles chat messages and returns a streaming response.

## Testing

To run the tests, use the following command:

```bash
npm test
```
