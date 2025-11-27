import { toolRegistry } from '../toolRegistry';

describe('ToolRegistry', () => {
  it('should execute a registered tool', async () => {
    const result = await toolRegistry.use('exampleTool', { a: 1, b: 2 });
    expect(result).toEqual({ result: 3 });
  });

  it('should throw an error for an unregistered tool', async () => {
    await expect(toolRegistry.use('unregisteredTool', {})).rejects.toThrow('Tool unregisteredTool not found');
  });

  it('should throw an error for invalid input', async () => {
    await expect(toolRegistry.use('exampleTool', { a: 1, b: '2' })).rejects.toThrow('Invalid input for tool exampleTool: Expected number, received string at "b"');
  });
});
