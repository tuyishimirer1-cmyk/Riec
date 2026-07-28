import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ProjectAssignmentsService } from './project-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Project Assignment (Project and Staff relation) Endpoints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('projects/:projectId/assignments')
export class ProjectAssignmentsController {
  constructor(private readonly service: ProjectAssignmentsService) {}

  @Post()
  @ResponseMessage('User assigned to project successfully')
  @ApiOperation({
    summary: 'Assign a user to a project',
    description:
      'Assign a team member (user) to a project with an optional role designation (e.g., "Lead Engineer", "Architect").',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiCreatedResponse({
    description: 'User assigned to project successfully',
    schema: {
      example: {
        id: 'assignment1',
        projectId: '65f34e7e0a2b3c4d5e6f7890',
        userId: '65f34e7e0a2b3c4d5e6f7893',
        role: 'Lead Engineer',
        assignedAt: '2024-01-15T10:30:00Z',
        user: {
          id: '65f34e7e0a2b3c4d5e6f7893',
          email: 'engineer@example.com',
          role: 'ENGINEER',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Project or user not found with the provided IDs',
  })
  @ApiConflictResponse({
    description: 'User is already assigned to this project',
  })
  assign(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.service.assign(projectId, dto);
  }

  @Get()
  @ResponseMessage('Project assignments retrieved successfully')
  @ApiOperation({
    summary: 'List all assignments for a project',
    description: 'Retrieve all team members assigned to a specific project.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'List of project assignments with user details',
    schema: {
      example: {
        data: [
          {
            id: 'assignment1',
            projectId: '65f34e7e0a2b3c4d5e6f7890',
            userId: '65f34e7e0a2b3c4d5e6f7893',
            role: 'Lead Engineer',
            assignedAt: '2024-01-15T10:30:00Z',
            user: {
              id: '65f34e7e0a2b3c4d5e6f7893',
              email: 'engineer@example.com',
              role: 'ENGINEER',
            },
          },
          {
            id: 'assignment2',
            projectId: '65f34e7e0a2b3c4d5e6f7890',
            userId: '65f34e7e0a2b3c4d5e6f7894',
            role: 'Site Supervisor',
            assignedAt: '2024-01-16T09:00:00Z',
            user: {
              id: '65f34e7e0a2b3c4d5e6f7894',
              email: 'supervisor@example.com',
              role: 'COMPANY_WORKER',
            },
          },
        ],
      },
    },
  })
  list(@Param('projectId') projectId: string) {
    return this.service.list(projectId);
  }

  @Put(':assignmentId')
  @ResponseMessage('Assignment role updated successfully')
  @ApiOperation({
    summary: 'Update assignment role',
    description:
      'Change the role designation for an existing project assignment. The user remains assigned; only the role text is updated.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'assignmentId',
    description: 'MongoDB ObjectId of the assignment',
    example: '65f34e7e0a2b3c4d5e6f7894',
  })
  @ApiBody({
    description: 'New role value',
    schema: {
      type: 'object',
      properties: { role: { type: 'string', example: 'Senior Engineer' } },
    },
  })
  @ApiOkResponse({
    description: 'Assignment role updated successfully',
    schema: {
      example: {
        id: 'assignment1',
        projectId: '65f34e7e0a2b3c4d5e6f7890',
        userId: '65f34e7e0a2b3c4d5e6f7893',
        role: 'Senior Engineer',
        assignedAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Assignment not found or does not belong to the project',
  })
  updateRole(
    @Param('projectId') projectId: string,
    @Param('assignmentId') assignmentId: string,
    @Body('role') role: string,
  ) {
    return this.service.updateRole(projectId, assignmentId, role);
  }

  @Delete(':assignmentId')
  @ResponseMessage('Assignment removed successfully')
  @ApiOperation({
    summary: 'Remove a user from a project',
    description:
      "Remove a team member's assignment from a project. This does not delete the user account.",
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'assignmentId',
    description: 'MongoDB ObjectId of the assignment to remove',
    example: '65f34e7e0a2b3c4d5e6f7894',
  })
  @ApiOkResponse({
    description: 'Assignment removed successfully',
    schema: {
      example: { message: 'Assignment removed successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Assignment not found or does not belong to the project',
  })
  unassign(
    @Param('projectId') projectId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.service.unassign(projectId, assignmentId);
  }
}
