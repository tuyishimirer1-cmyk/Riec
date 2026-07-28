import { INestApplication } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';

export async function createTestApp(
  metadata: ModuleMetadata,
  configureModule?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<INestApplication> {
  const baseBuilder = Test.createTestingModule(metadata);
  const configuredBuilder = configureModule
    ? configureModule(baseBuilder)
    : baseBuilder;
  const moduleFixture: TestingModule = await configuredBuilder.compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return app;
}
