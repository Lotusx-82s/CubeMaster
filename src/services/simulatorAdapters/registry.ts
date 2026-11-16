import type { SimulatorAdapter, SimulatorParseResult } from './types';
import { algCubingNetAdapter } from './algCubingNetAdapter';
import { cubeDbAdapter } from './cubeDbAdapter';
import { cubeMasterAdapter } from './cubeMasterAdapter';
import { rubiksCubeAdapter } from './rubiksCubeAdapter';

// Whitelist registry of approved simulators
export const SIMULATOR_ADAPTERS: SimulatorAdapter[] = [
  algCubingNetAdapter,
  cubeDbAdapter,
  rubiksCubeAdapter,
  cubeMasterAdapter,
];

/**
 * Validates and processes a simulator URL through the adapter registry.
 * Strictly checks:
 * 1. Valid URL syntax.
 * 2. Only http: and https: protocols (blocks javascript:, data:, file:, etc.).
 * 3. Whitelisted simulator domain matching (prevents SSRF or untrusted sites).
 * 4. Extracted move validation and invariant testing.
 */
export function parseSimulatorUrl(rawUrlString: string): SimulatorParseResult {
  if (!rawUrlString || typeof rawUrlString !== 'string') {
    return {
      success: false,
      simulatorName: 'Unknown',
      errorCode: 'INVALID_URL',
      error: 'Please enter a valid URL.',
    };
  }

  const trimmed = rawUrlString.trim();

  // 1. Validate URL syntax
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return {
      success: false,
      simulatorName: 'Unknown',
      errorCode: 'INVALID_URL',
      error: 'The provided string is not a valid URL. Ensure it starts with http:// or https://.',
    };
  }

  // 2. Protocol security check: only http and https allowed
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      success: false,
      simulatorName: 'Unknown',
      errorCode: 'INVALID_URL',
      error: `Unsupported protocol '${parsedUrl.protocol}'. Only secure HTTP and HTTPS links are allowed.`,
    };
  }

  // 3. Find matching adapter from whitelist registry
  const adapter = SIMULATOR_ADAPTERS.find(a => a.matchesUrl(parsedUrl));

  if (!adapter) {
    const supportedList = SIMULATOR_ADAPTERS.map(a => a.name).join(', ');
    return {
      success: false,
      simulatorName: parsedUrl.hostname,
      errorCode: 'UNSUPPORTED_SIMULATOR',
      error: `The domain '${parsedUrl.hostname}' is not a recognized cube simulator. Supported simulators: ${supportedList}.`,
    };
  }

  // 4. Delegate parsing and normalization to the specific adapter
  try {
    return adapter.parse(parsedUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown extraction error';
    return {
      success: false,
      simulatorName: adapter.name,
      errorCode: 'EXTRACTION_FAILURE',
      error: `Failed to extract cube configuration from this simulator link: ${message}`,
    };
  }
}
