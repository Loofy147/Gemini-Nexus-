import { z } from 'zod';

type ToolFunction = (input: any) => Promise<any>;

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  execute: ToolFunction;
}

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  async use(toolName: string, input: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    try {
      const validatedInput = tool.inputSchema.parse(input);
      return await tool.execute(validatedInput);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input for tool ${toolName}: ${error.errors.map(e => `${e.message} at "${e.path.join('.')}"`).join(', ')}`);
      }
      throw error;
    }
  }
}

export const toolRegistry = new ToolRegistry();

// Example tool
const exampleTool: Tool = {
  name: 'exampleTool',
  description: 'An example tool that adds two numbers.',
  inputSchema: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ a, b }) => {
    return { result: a + b };
  },
};

toolRegistry.register(exampleTool);
