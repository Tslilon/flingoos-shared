#!/usr/bin/env node
/**
 * Generate JSON Schemas from Zod Schemas
 * 
 * Exports individual schema files with proper $id, title, and version metadata
 * Uses stable options to avoid nested refs that confuse Python generators
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { zodToJsonSchema } from 'zod-to-json-schema';
import * as schemas from '../dist/schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = `${__dirname}/../dist/schema`;

// Schema metadata
const PACKAGE_VERSION = '0.1.0';
const BASE_URI = 'https://schemas.flingoos.com/shared/v0.1.0/';

// Schema definitions to export
const SCHEMA_EXPORTS = {
  // Session Manager API schemas
  'session-start-response': {
    schema: schemas.SessionStartResponseSchema,
    title: 'Session Start Response',
    description: 'Response from Session Manager API when starting a session'
  },
  'session-stop-response': {
    schema: schemas.SessionStopResponseSchema,
    title: 'Session Stop Response', 
    description: 'Response from Session Manager API when stopping a session'
  },
  'session-status-response': {
    schema: schemas.SessionStatusResponseSchema,
    title: 'Session Status Response',
    description: 'Response from Session Manager API status endpoint'
  },
  'session-internal-state': {
    schema: schemas.SessionInternalStateSchema,
    title: 'Session Internal State',
    description: 'Internal session state structure used by Session Manager'
  },
  
  // Bridge Command API schemas
  'bridge-command-request': {
    schema: schemas.BridgeCommandRequestSchema,
    title: 'Bridge Command Request',
    description: 'Request payload for Bridge command API'
  },
  'bridge-command-response': {
    schema: schemas.BridgeCommandResponseSchema,
    title: 'Bridge Command Response',
    description: 'Response payload from Bridge command API'
  },
  
  // Forge Pipeline schemas
  'forge-job-response': {
    schema: schemas.ForgeJobResponseSchema,
    title: 'Forge Job Response',
    description: 'Complete response from Forge pipeline processing'
  },
  'forge-manifest': {
    schema: schemas.ForgeManifestSchema,
    title: 'Forge Manifest',
    description: 'Forge pipeline execution manifest with artifacts and stage executions'
  },
  'stage-execution': {
    schema: schemas.StageExecutionSchema,
    title: 'Stage Execution',
    description: 'Individual pipeline stage execution record'
  },
  'forge-artifact': {
    schema: schemas.ForgeArtifactSchema,
    title: 'Forge Artifact',
    description: 'Forge pipeline output artifact metadata'
  },
  'forge-counters': {
    schema: schemas.ForgeCountersSchema,
    title: 'Forge Counters',
    description: 'Forge pipeline processing statistics and counters'
  },
  
  // Progress and workflow schemas
  'job-progress': {
    schema: schemas.JobProgressSchema,
    title: 'Job Progress',
    description: 'Job progress calculation with stage completion tracking'
  },
  'forge-trigger': {
    schema: schemas.ForgeTriggerSchema,
    title: 'Forge Trigger',
    description: 'Trigger payload for Forge pipeline processing'
  },
  
  // WebSocket and UI schemas
  'session-event': {
    schema: schemas.SessionEventSchema,
    title: 'Session Event',
    description: 'WebSocket session event messages for real-time UI updates'
  },
  'firestore-workflow': {
    schema: schemas.FirestoreWorkflowSchema,
    title: 'Firestore Workflow',
    description: 'Complete workflow document structure stored in Firestore'
  },
  
  // Error handling schemas
  'standard-error-response': {
    schema: schemas.StandardErrorResponseSchema,
    title: 'Standard Error Response',
    description: 'Standard error response format across all services'
  },
  'error-envelope': {
    schema: schemas.ErrorEnvelopeSchema,
    title: 'Error Envelope',
    description: 'Standardized error envelope for structured error handling'
  }
};

// JSON Schema generation options (stable, avoid nested refs)
const JSON_SCHEMA_OPTIONS = {
  $refStrategy: 'none',  // Avoid nested refs that confuse Python generators
  target: 'jsonSchema7',
  definitionPath: 'definitions',
  definitions: {},
  errorMessages: true,
  markdownDescription: true
};

function generateSchemas() {
  console.log('🏗️  Generating JSON Schemas...\n');
  
  // Create output directory
  mkdirSync(outputDir, { recursive: true });
  
  let generatedCount = 0;
  const generatedFiles = [];
  
  // Generate each schema file
  for (const [filename, config] of Object.entries(SCHEMA_EXPORTS)) {
    try {
      const jsonSchema = zodToJsonSchema(config.schema, JSON_SCHEMA_OPTIONS);
      
      // Add metadata
      const enrichedSchema = {
        $id: `${BASE_URI}${filename}.json`,
        $schema: 'https://json-schema.org/draft-07/schema#',
        title: config.title,
        description: config.description,
        version: PACKAGE_VERSION,
        generated: new Date().toISOString(),
        ...jsonSchema
      };
      
      // Write to file
      const outputPath = `${outputDir}/${filename}.json`;
      writeFileSync(outputPath, JSON.stringify(enrichedSchema, null, 2));
      
      console.log(`✅ ${filename}.json`);
      generatedCount++;
      generatedFiles.push(outputPath);
      
    } catch (error) {
      console.error(`❌ Failed to generate ${filename}.json:`, error.message);
      process.exit(1);
    }
  }
  
  // Generate index file for easy discovery
  const indexData = {
    $id: `${BASE_URI}index.json`,
    title: 'Flingoos Shared Schemas Index',
    version: PACKAGE_VERSION,
    generated: new Date().toISOString(),
    schemas: Object.entries(SCHEMA_EXPORTS).map(([filename, config]) => ({
      filename: `${filename}.json`,
      title: config.title,
      description: config.description,
      $ref: `${BASE_URI}${filename}.json`
    }))
  };
  
  writeFileSync(`${outputDir}/index.json`, JSON.stringify(indexData, null, 2));
  console.log(`✅ index.json`);
  generatedCount++;
  
  console.log(`\n📊 Generated ${generatedCount} JSON Schema files`);
  console.log(`📁 Output directory: ${outputDir}`);
  
  return generatedFiles;
}

// Run schema generation
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const files = generateSchemas();
      console.log('\n🎉 Schema generation complete!');
      
      // Verify files can be parsed
      console.log('\n🧪 Verifying generated schemas...');
      const { readFileSync } = await import('fs');
      files.forEach(file => {
        try {
          JSON.parse(readFileSync(file, 'utf8'));
          const relativePath = file.replace('../dist/schema/', '');
          console.log(`✅ ${relativePath} - Valid JSON`);
        } catch (error) {
          console.log(`❌ ${file} - Invalid JSON:`, error.message);
          process.exit(1);
        }
      });
      
      console.log('\n✅ All schemas validated successfully!');
    } catch (error) {
      console.error('💥 Schema generation failed:', error);
      process.exit(1);
    }
  })();
}
