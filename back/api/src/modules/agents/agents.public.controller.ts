import { Controller, Get } from '@nestjs/common';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsPublicController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('default')
  async getDefault() {
    const agent = await this.agentsService.getDefaultAgent();
    if (!agent) {
      return { success: false, error: 'No default agent configured' };
    }
    return { success: true, data: agent };
  }
}
